import { BlockRange } from '../../model'
import { BlockRecord } from '../../peripherals/database/BlockRepository'
import { SyncStatusRepository } from '../../peripherals/database/SyncStatusRepository'
import { JobQueue } from '../../tools/JobQueue'
import { Logger } from '../../tools/Logger'
import { DataSyncService } from '../DataSyncService'
import { BlockDownloader } from './BlockDownloader'
import {
  INITIAL_SYNC_STATE,
  SyncSchedulerAction,
  syncSchedulerReducer,
  SyncState,
} from './syncSchedulerReducer'

/** block of the first verifier deploy */
const EARLIEST_BLOCK = 11813207

export class SyncScheduler {
  private state: SyncState = INITIAL_SYNC_STATE
  private jobQueue: JobQueue

  constructor(
    private readonly syncStatusRepository: SyncStatusRepository,
    private readonly blockDownloader: BlockDownloader,
    private readonly dataSyncService: DataSyncService,
    private readonly logger: Logger,
    private readonly earliestBlock = EARLIEST_BLOCK,
    private readonly blocksLimit = Infinity
  ) {
    this.logger = logger.for(this)
    this.jobQueue = new JobQueue({ maxConcurrentJobs: 1 }, this.logger)
  }

  private isBlockBeforeLimit(blockNumber: number) {
    return blockNumber - this.earliestBlock + 1 <= this.blocksLimit
  }

  private onNewBlock(block: BlockRecord) {
    const blockNumber = block.number
    if (!this.isBlockBeforeLimit(blockNumber)) {
      this.logger.info(
        'Skipping new block - it is outside of the acceptable limit',
        {
          blockNumber,
          earliestBlock: this.earliestBlock,
          blocksLimit: this.blocksLimit,
        }
      )
      return
    }
    this.dispatch({ type: 'newBlockFound', block })
  }

  private onReorg(blocks: BlockRecord[]) {
    const blockNumber = blocks[blocks.length - 1].number
    if (!this.isBlockBeforeLimit(blockNumber)) {
      this.logger.info(
        'Skipping reorg - last block is outside of the acceptable limit',
        {
          blockNumber,
          earliestBlock: this.earliestBlock,
          blocksLimit: this.blocksLimit,
        }
      )
      return
    }
    this.dispatch({ type: 'reorgOccurred', blocks })
  }

  async start() {
    const lastSynced =
      (await this.syncStatusRepository.getLastSynced()) ?? this.earliestBlock

    await this.dataSyncService.discardAfter(lastSynced)

    const knownBlocks = await this.blockDownloader.getKnownBlocks(lastSynced)
    this.dispatch({ type: 'initialized', lastSynced, knownBlocks })

    this.blockDownloader.onNewBlock(this.onNewBlock)

    this.blockDownloader.onReorg(this.onReorg)

    this.logger.info('start', { lastSynced })
  }

  private dispatch(action: SyncSchedulerAction) {
    const [newState, effect] = syncSchedulerReducer(this.state, action)
    this.state = newState

    this.logger.debug({ method: 'dispatch', action: action.type })

    if (effect) {
      this.jobQueue.add({
        name: 'action',
        execute: async () => {
          this.logger.debug({ method: 'effect', effect: effect.type })

          if (effect.type === 'sync') {
            await this.handleSync(effect.blocks)
          } else if (effect.type === 'discardAfter') {
            await this.handleDiscardAfter(effect.blockNumber)
          }
        },
      })
    }
  }

  private async handleSync(blocks: BlockRange) {
    try {
      await this.dataSyncService.discardAfter(blocks.start - 1)
      await this.dataSyncService.sync(blocks)
      await this.syncStatusRepository.setLastSynced(blocks.end - 1)
      this.dispatch({ type: 'syncSucceeded' })
    } catch (err) {
      this.dispatch({ type: 'syncFailed', blocks })
      this.logger.error(err)
    }
  }

  private async handleDiscardAfter(blockNumber: number) {
    try {
      await this.syncStatusRepository.setLastSynced(blockNumber)
      await this.dataSyncService.discardAfter(blockNumber)
      this.dispatch({ type: 'discardAfterSucceeded', blockNumber })
    } catch (err) {
      this.dispatch({ type: 'discardAfterFailed' })
      this.logger.error(err)
    }
  }
}
