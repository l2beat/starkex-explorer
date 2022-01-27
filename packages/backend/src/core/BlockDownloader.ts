import assert from 'assert'
import { providers } from 'ethers'
import { last, range } from 'lodash'

import { json } from '../model'
import {
  BlockRecord,
  BlockRepository,
} from '../peripherals/database/BlockRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { BlockNumber, BlockRange } from '../peripherals/ethereum/types'
import { createEventEmitter } from '../tools/EventEmitter'
import { JobQueue } from '../tools/JobQueue'
import { Logger } from '../tools/Logger'

export interface KnownBlock {
  number: number
  hash: string
}

type State = { t: 'not-started' } | { t: 'working'; lastKnownBlock: KnownBlock }

export class BlockDownloader {
  private events = createEventEmitter<BlockDownloaderEvents>()
  private state: State = { t: 'not-started' }
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

    this.state = { t: 'working', lastKnownBlock }

    return this.startBackgroundWork()
  }

  getStatus() {
    const status: json = { status: this.state.t }

    if (this.state.t === 'working')
      status.lastKnownBlock = { ...this.state.lastKnownBlock }

    return status
  }

  getLastKnownBlock() {
    if (this.state.t !== 'working') {
      throw new Error('Not started')
    }
    return this.state.lastKnownBlock
  }

  onNewBlocks(handler: (blockRange: BlockRange) => void) {
    this.events.on('newBlocks', handler)
    return () => {
      this.events.off('newBlocks', handler)
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
        execute: async () => {
          // This job won't be retried by jobQueue
          try {
            await this.handleNewBlock(block)
          } catch (error) {
            this.logger.error(error)
          }
        },
      })
    )
  }

  private async handleNewBlock(
    latest: IncomingBlock,
    retriesRemaining = 2
  ): Promise<void> {
    if (this.state.t !== 'working') return

    let lastKnown = this.state.lastKnownBlock
    let next =
      latest.number === lastKnown.number + 1
        ? latest
        : await this.ethereumClient.getBlock(lastKnown.number + 1)

    if (next.parentHash !== lastKnown.hash) {
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
      if (retriesRemaining > 0) {
        return this.handleNewBlock(latest, retriesRemaining - 1)
      }
      throw new Error(
        `Inconsistent chain from ${lastKnown.number} to ${latest.number}\n` +
          JSON.stringify(
            newBlocks.map((x) => `hash: ${x.hash}, parent: ${x.parentHash}`),
            null,
            2
          )
      )
    }

    await this.blockRepository.add(
      newBlocks.map((block) => ({ hash: block.hash, number: block.number }))
    )

    this.state.lastKnownBlock = { hash: latest.hash, number: latest.number }

    this.events.emit('newBlocks', {
      from: lastKnown.number + 1,
      to: latest.number,
    })
  }

  // We check if the last known block was reorged, if so, we find the reorg
  // point and delete all blocks after it, rebuilding our block database
  private async handlePastReorganizations(): Promise<BlockRecord> {
    if (this.state.t !== 'working') {
      throw new Error('not started')
    }

    const lastKnown = this.state.lastKnownBlock

    const lastKnownFromChain = await this.ethereumClient.getBlock(
      lastKnown.number
    )

    this.logger.info({
      method: 'handlePastReorganizations',
      blockNumber: lastKnown.number,
      hashInDb: lastKnown.hash,
      hashOnChain: lastKnownFromChain.hash,
    })

    if (lastKnownFromChain.hash === lastKnown.hash) {
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

      if (fromDb.hash === fromChain.hash) {
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

interface BlockDownloaderEvents {
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
