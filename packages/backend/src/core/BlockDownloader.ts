import assert from 'assert'
import { providers } from 'ethers'
import { range } from 'lodash'

import { BlockRange, Hash256, json } from '../model'
import {
  BlockRecord,
  BlockRepository,
} from '../peripherals/database/BlockRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { BlockNumber } from '../peripherals/ethereum/types'
import { createEventEmitter } from '../tools/EventEmitter'
import { JobQueue } from '../tools/JobQueue'
import { Logger } from '../tools/Logger'

export interface KnownBlock {
  readonly number: number
  readonly hash: Hash256
}

type State =
  | { type: 'not-started' }
  | { type: 'working'; lastKnownBlock: KnownBlock }

export class BlockDownloader {
  private events = createEventEmitter<BlockDownloaderEvents>()
  private state: State = { type: 'not-started' }
  private jobQueue: JobQueue

  constructor(
    private ethereumClient: EthereumClient,
    private blockRepository: BlockRepository,
    private logger: Logger
  ) {
    this.logger = this.logger.for(this)
    this.jobQueue = new JobQueue({ maxConcurrentJobs: 1 }, this.logger)
  }

  async start() {
    const lastKnownBlock = await this.blockRepository.getLast()

    this.state = { type: 'working', lastKnownBlock }

    return this.startBackgroundWork()
  }

  getStatus() {
    const status: json = { status: this.state.type }

    if (this.state.type === 'working')
      status.lastKnownBlock = {
        number: this.state.lastKnownBlock.number,
        hash: this.state.lastKnownBlock.hash.toString(),
      }

    return status
  }

  getLastKnownBlock() {
    if (this.state.type !== 'working') {
      throw new Error('Not started')
    }

    return this.state.lastKnownBlock
  }

  onNewBlocks(from: number, handler: (blockRange: BlockRange) => void) {
    const lastKnown = this.getLastKnownBlock().number
    if (from > lastKnown) {
      throw new TypeError('From cannot be in the future')
    }

    let synced = from === lastKnown
    let cancelled = false
    let range = BlockRange.EMPTY
    if (!synced) {
      this.blockRepository.getAllInRange(from, lastKnown).then((blocks) => {
        range = range.merge(new BlockRange(blocks))
        if (!cancelled) {
          handler(range)
          synced = true
        }
      })
    }

    function onBlocks(blockRange: BlockRange) {
      if (!synced) {
        range = range.merge(blockRange)
      } else {
        handler(blockRange)
      }
    }

    this.events.on('newBlocks', onBlocks)
    return () => {
      cancelled = true
      this.events.off('newBlocks', onBlocks)
    }
  }

  onReorg(handler: (point: { firstChangedBlock: BlockNumber }) => void) {
    this.events.on('reorg', handler)
    return () => {
      this.events.off('reorg', handler)
    }
  }

  private startBackgroundWork() {
    return this.ethereumClient.onBlock((block) =>
      this.jobQueue.add({
        name: `handleNewBlock-${block.number}-${block.hash}`,
        execute: async () => this.handleNewBlock(block),
        maxRetries: 2,
      })
    )
  }

  private async handleNewBlock(latest: IncomingBlock): Promise<void> {
    if (this.state.type !== 'working') return

    let lastKnown = this.state.lastKnownBlock
    let next =
      latest.number === lastKnown.number + 1
        ? latest
        : await this.ethereumClient.getBlock(lastKnown.number + 1)

    if (next.parentHash !== lastKnown.hash.toString()) {
      lastKnown = await this.handlePastReorganizations()
      next = await this.ethereumClient.getBlock(lastKnown.number + 1)
    }

    const newBlocks: IncomingBlock[] =
      next === latest
        ? [next]
        : [
            next,
            ...(await Promise.all(
              range(lastKnown.number + 2, latest.number).map((blockNumber) =>
                this.ethereumClient.getBlock(blockNumber)
              )
            )),
            latest,
          ]

    // We fetch and save all blocks from the last known block, validating their
    // parentHashes to ensure they form a valid chain, if they don't, we go back
    // to the beginning of the procedure.
    if (!isConsistentChain(newBlocks)) {
      throw new Error(
        `Inconsistent chain from ${lastKnown.number} to ${latest.number}\n` +
          JSON.stringify(
            newBlocks.map((x) => `hash: ${x.hash}, parent: ${x.parentHash}`),
            null,
            2
          )
      )
    }

    const newBlockRecords = newBlocks.map(
      (block): BlockRecord => ({
        hash: Hash256(block.hash),
        number: block.number,
      })
    )

    await this.blockRepository.add(newBlockRecords)

    this.state.lastKnownBlock = {
      hash: Hash256(latest.hash),
      number: latest.number,
    }

    this.events.emit('newBlocks', new BlockRange(newBlockRecords))
  }

  // We check if the last known block was reorged, if so, we find the reorg
  // point and delete all blocks after it, rebuilding our block database
  private async handlePastReorganizations(): Promise<BlockRecord> {
    assert(this.state.type === 'working', 'block downloader not started')

    const lastKnown = this.state.lastKnownBlock

    const lastKnownFromChain = await this.ethereumClient.getBlock(
      lastKnown.number
    )

    this.logger.info({
      method: 'handlePastReorganizations',
      blockNumber: lastKnown.number,
      hashInDb: lastKnown.hash.toString(),
      hashOnChain: lastKnownFromChain.hash,
    })

    if (lastKnownFromChain.hash === lastKnown.hash.toString()) {
      // no reorg in the past, last known block is still valid
      return lastKnown
    }

    const INITIAL_OFFSET = 10

    let lastUnchangedBlock: BlockRecord | undefined

    // we find the reorg point and delete all blocks after it
    for (
      let offset = INITIAL_OFFSET;
      offset < 1_000;
      // If the hash is empty, we'll check the block twice as far back.
      offset *= 2
    ) {
      const fromDb = await this.blockRepository.getByNumber(
        lastKnown.number - offset
      )

      if (!fromDb) {
        // If we don't have a block this early, we'll announce reorganization on
        // after the first block number we have in the database.
        // We assume the first block we have can never be reorged.
        lastUnchangedBlock = this.blockRepository.getFirst()
        break
      }

      const fromChain = await this.ethereumClient.getBlock(
        lastKnown.number - offset
      )

      if (fromDb.hash.toString() === fromChain.hash) {
        // This is a good block, the reorg happened after it.
        lastUnchangedBlock = fromDb
        break
      }
    }

    if (!lastUnchangedBlock) throw new Error('Unreasonable reorganization')

    this.blockRepository.deleteAllAfter(lastUnchangedBlock.number)
    // The reaorg happened at `lastUnchangedBlock.number + 1` or later.
    // @todo I kinda feel we should always binary search for the correct reorg point. There would be more code, but less corner cases to remember about.
    this.events.emit('reorg', {
      firstChangedBlock: lastUnchangedBlock.number + 1,
    })
    return (this.state.lastKnownBlock = lastUnchangedBlock)
  }
}

/** @internal */
export type IncomingBlock = Pick<
  providers.Block,
  'hash' | 'number' | 'timestamp' | 'parentHash'
>

export interface BlockDownloaderEvents {
  newBlocks: BlockRange
  reorg: { firstChangedBlock: number }
}

/** @internal */
export function isConsistentChain(
  blocks: { hash: string; parentHash: string }[]
) {
  for (let i = 1; i < blocks.length; i++) {
    if (blocks[i - 1].hash !== blocks[i].parentHash) {
      return false
    }
  }

  return true
}
