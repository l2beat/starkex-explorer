import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { createEventEmitter } from '../tools/EventEmitter'
import { Logger } from '../tools/Logger'

export interface SafeBlock {
  blockNumber: number
  timestamp: number /* unix time in seconds */
}

interface SafeBlockEvents {
  newBlock: SafeBlock
}

export class SafeBlockService {
  private events = createEventEmitter<SafeBlockEvents>()
  private safeBlock: SafeBlock | undefined
  private started = false
  private lastUpdatedAt = new Date().toISOString()

  constructor(
    private refreshIntervalMs: number,
    private blockOffset: number,
    private ethereumClient: EthereumClient,
    private logger: Logger
  ) {
    this.logger = this.logger.for(this)
  }
  async start() {
    this.started = true
    this.lastUpdatedAt = new Date().toISOString()
    await this.updateSafeBlock()
    return this.startBackgroundWork()
  }

  getStatus() {
    if (!this.safeBlock) {
      return {
        lastUpdatedAt: this.lastUpdatedAt,
        started: this.started,
        safeBlockNumber: null,
        safeBlockTime: null,
        safeBlockTimestamp: null,
      }
    }

    const { blockNumber, timestamp } = this.safeBlock

    return {
      lastUpdatedAt: this.lastUpdatedAt,
      started: this.started,
      safeBlockNumber: blockNumber.toString(),
      safeBlockTime: new Date(timestamp * 1000).toISOString(),
      safeBlockTimestamp: timestamp,
    }
  }

  getSafeBlock() {
    if (!this.safeBlock) {
      throw new Error('Not started')
    }
    return this.safeBlock
  }

  onNewSafeBlock(fn: (block: SafeBlock) => void) {
    if (this.safeBlock) {
      fn(this.getSafeBlock())
    }
    this.events.on('newBlock', fn)
    return () => {
      this.events.off('newBlock', fn)
    }
  }

  private startBackgroundWork() {
    const run = async () => {
      try {
        await this.updateSafeBlock()
      } catch (e) {
        this.logger.error(e)
      }
    }
    const interval = setInterval(run, this.refreshIntervalMs)
    return () => clearInterval(interval)
  }

  private async updateSafeBlock() {
    const lastBlock = await this.ethereumClient.getBlockNumber()

    // we use a block in the past to not have to worry about reorgs
    const blockNumber = lastBlock - this.blockOffset
    const { timestamp } = await this.ethereumClient.getBlock(blockNumber)
    const safeBlock = { timestamp, blockNumber }

    this.safeBlock = safeBlock
    this.lastUpdatedAt = new Date().toISOString()
    this.logger.info('safe block found', safeBlock)
    this.events.emit('newBlock', safeBlock)
  }
}
