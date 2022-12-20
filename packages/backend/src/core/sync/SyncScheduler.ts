import { BlockRange } from '../../model'
import { SyncStatusRepository } from '../../peripherals/database/SyncStatusRepository'
import { JobQueue } from '../../tools/JobQueue'
import { Logger } from '../../tools/Logger'
import { PerpetualRollupSyncService } from '../PerpetualRollupSyncService'
import { PerpetualValidiumSyncService } from '../PerpetualValidiumSyncService'
import { SpotValidiumSyncService } from '../SpotValidiumSyncService'
import { BlockDownloader } from './BlockDownloader'
import {
  INITIAL_SYNC_STATE,
  SyncSchedulerAction,
  syncSchedulerReducer,
  SyncState,
} from './syncSchedulerReducer'

interface SyncSchedulerOptions {
  earliestBlock: number
  maxBlockNumber?: number
}

export class SyncScheduler {
  private state: SyncState = INITIAL_SYNC_STATE
  private jobQueue: JobQueue
  private earliestBlock: number
  private maxBlockNumber: number

  constructor(
    private readonly syncStatusRepository: SyncStatusRepository,
    private readonly blockDownloader: BlockDownloader,
    private readonly dataSyncService:
      | PerpetualRollupSyncService
      | PerpetualValidiumSyncService
      | SpotValidiumSyncService,
    private readonly logger: Logger,
    opts: SyncSchedulerOptions
  ) {
    this.logger = logger.for(this)
    this.earliestBlock = opts.earliestBlock
    this.maxBlockNumber = opts.maxBlockNumber ?? Infinity
    this.jobQueue = new JobQueue({ maxConcurrentJobs: 1 }, this.logger)
  }

  async start() {
    const lastSynced =
      (await this.syncStatusRepository.getLastSynced()) ?? this.earliestBlock

    await this.dataSyncService.discardAfter(lastSynced)

    const knownBlocks = await this.blockDownloader.getKnownBlocks(lastSynced)
    this.dispatch({ type: 'initialized', lastSynced, knownBlocks })

    this.blockDownloader.onNewBlock((block) =>
      this.dispatch({ type: 'newBlockFound', block })
    )

    this.blockDownloader.onReorg((blocks) =>
      this.dispatch({ type: 'reorgOccurred', blocks })
    )

    this.logger.info('start', { lastSynced })
  }

  dispatch(action: SyncSchedulerAction) {
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
          } else {
            await this.handleDiscardAfter(effect.blockNumber)
          }
        },
      })
    }
  }

  async handleSync(blocks: BlockRange) {
    if (blocks.end > this.maxBlockNumber) {
      this.logger.info(
        'Skipping data sync - the end of block range is after the max acceptable block number',
        {
          blockStart: blocks.start,
          blockEnd: blocks.end,
          maxBlockNumber: this.maxBlockNumber,
        }
      )
      // Returning here means no 'syncSucceeded' event will get dispatched
      // This means that syncSchedulerReducer will never return blocks to sync anymore
      // Used to limit the amount of data getting stored in the database if required (e.g. Heroku Review Apps)
      return
    }
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
