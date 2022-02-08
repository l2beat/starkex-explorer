import { providers } from 'ethers'

import { Hash256, json } from '../../model'
import {
  BlockRecord,
  BlockRepository,
} from '../../peripherals/database/BlockRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { createEventEmitter } from '../../tools/EventEmitter'
import { JobQueue } from '../../tools/JobQueue'
import { Logger } from '../../tools/Logger'

export interface BlockDownloaderEvents {
  newBlocks: BlockRecord[]
  reorg: BlockRecord[]
}

const SAFE_BLOCK_DISTANCE = 100

export class BlockDownloader {
  private events = createEventEmitter<BlockDownloaderEvents>()
  private jobQueue: JobQueue

  private lastKnown = 0
  private queueTip = 0
  private started = false

  constructor(
    private ethereumClient: EthereumClient,
    private blockRepository: BlockRepository,
    private logger: Logger
  ) {
    this.logger = this.logger.for(this)
    this.jobQueue = new JobQueue({ maxConcurrentJobs: 1 }, this.logger)
  }

  async start() {
    this.started = true
    this.lastKnown = (await this.blockRepository.getLast()).number 
    this.queueTip = await this.ethereumClient.getBlockNumber()

    const queueStart = Math.max(this.lastKnown, this.queueTip - SAFE_BLOCK_DISTANCE)

    if (this.lastKnown + 1 < queueStart) {
      this.advanceChain(this.queueTip + 1)
    }

    for (let i = queueStart; i <= this.queueTip; i++) {
      this.advanceChain(i)
    }

    return this.ethereumClient.onBlock((block) => {
      for (let i = this.queueTip; i <= block.number; i++) {
        this.advanceChain(i)
      }
      this.queueTip = block.number
    })
  }

  private advanceChain(blockNumber: number) {
    this.jobQueue.add({
      name: `advanceChain-${blockNumber}`,
      execute: () => this.executeAdvanceChain(blockNumber),
    })
  }

  getStatus(): json {
    return {
      started: this.started,
      lastKnown: this.lastKnown,
      queueTip: this.queueTip
    }
  }

  async getKnownBlocks(from: number) {
    const lastKnown = await this.blockRepository.getLast()
    return this.blockRepository.getAllInRange(from, lastKnown.number)
  }

  onNewBlocks(handler: (blocks: BlockRecord[]) => void) {
    this.events.on('newBlocks', handler)
    return () => {
      this.events.off('newBlocks', handler)
    }
  }

  onReorg(handler: (newBlocks: BlockRecord[]) => void) {
    this.events.on('reorg', handler)
    return () => {
      this.events.off('reorg', handler)
    }
  }

  private async executeAdvanceChain(blockNumber: number): Promise<void> {
    let [block, parent] = await Promise.all([
      this.ethereumClient.getBlock(blockNumber),
      this.getKnownBlock(blockNumber - 1),
    ])
    if (Hash256(block.parentHash) === parent.hash) {
      const record: BlockRecord = {
        number: block.number,
        hash: Hash256(block.hash),
      }
      await this.blockRepository.add([record])
      this.events.emit('newBlocks', [record])
    } else {
      const changed: providers.Block[] = [block]
      while (Hash256(block.parentHash) !== parent.hash) {
        blockNumber--
        ;[block, parent] = await Promise.all([
          this.ethereumClient.getBlock(Hash256(block.parentHash)),
          this.getKnownBlock(blockNumber - 1),
        ])
        changed.push(block)
      }
      const records = changed.reverse().map((block) => ({
        number: block.number,
        hash: Hash256(block.hash),
      }))
      await this.blockRepository.deleteAllAfter(records[0].number - 1)
      await this.blockRepository.add(records)
      this.events.emit('reorg', records)
    }
  }

  private async getKnownBlock(blockNumber: number): Promise<BlockRecord> {
    const known = await this.blockRepository.getByNumber(blockNumber)
    if (known) {
      return known
    }
    const downloaded = await this.ethereumClient.getBlock(blockNumber)
    const record: BlockRecord = {
      number: downloaded.number,
      hash: Hash256(downloaded.hash),
    }
    await this.blockRepository.add([record])
    return record
  }
}
