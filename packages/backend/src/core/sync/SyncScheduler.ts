import assert from 'assert'

import { BlockRange } from '../../model'
import { SyncStatusRepository } from '../../peripherals/database/SyncStatusRepository'
import { Logger } from '../../tools/Logger'
import { DataSyncService } from '../DataSyncService'
import { BlockDownloader } from './BlockDownloader'
import {
  INITIAL_SYNC_STATE,
  SyncSchedulerAction,
  SyncSchedulerEffect,
  syncSchedulerReducer,
  SyncState,
} from './syncSchedulerReducer'

export type SyncSchedulerEffectHandlers = {
  [P in SyncSchedulerEffect]: (state: SyncState) => void
}

export class SyncScheduler {
  private state: SyncState = INITIAL_SYNC_STATE
  private readonly effects: SyncSchedulerEffectHandlers

  constructor(
    private readonly syncStatusRepository: SyncStatusRepository,
    private readonly blockDownloader: BlockDownloader,
    private readonly dataSyncService: DataSyncService,
    private readonly logger: Logger
  ) {
    this.logger = logger.for(this)

    this.effects = {
      sync: async ({ blocksProcessing, latestBlockProcessed }) => {
        void this.syncStatusRepository.setLastBlockNumberSynced(
          latestBlockProcessed
        )
        try {
          await this.dataSyncService.sync(new BlockRange(blocksProcessing))
          this.dispatch({ type: 'syncFinished', success: true })
        } catch (err) {
          this.dispatch({ type: 'syncFinished', success: false })
          this.logger.error(err)
        }
      },
      discardAfter: async ({ blocksToProcess, latestBlockProcessed }) => {
        void this.syncStatusRepository.setLastBlockNumberSynced(
          latestBlockProcessed
        )

        assert(blocksToProcess.first, 'blocksToProcess.first must be defined')

        try {
          await this.dataSyncService.discardAfter(
            blocksToProcess.first.number - 1
          )
          this.dispatch({ type: 'discardFinished', success: true })
        } catch (err) {
          this.dispatch({ type: 'discardFinished', success: false })
          this.logger.error(err)
        }
      },
    }
  }

  private dispatch(action: SyncSchedulerAction) {
    const [newState, effects] = syncSchedulerReducer(this.state, action)

    effects.forEach((effect) => this.effects[effect](newState))

    this.logger.debug({
      method: 'dispatch',
      action: action.type,
      ...('success' in action && { success: action.success }),
      ...('blocks' in action &&
        action.blocks.length && {
          blocksRange: [
            action.blocks[0].number,
            action.blocks[action.blocks.length - 1].number,
          ].join(' - '),
        }),
    })

    this.state = newState
  }

  async start() {
    const lastSynced =
      await this.syncStatusRepository.getLastBlockNumberSynced()

    await this.dataSyncService.discardAfter(lastSynced)

    this.logger.info('start', { lastSynced })

    this.blockDownloader.onInit(lastSynced, (blocks) =>
      this.dispatch({ type: 'init', blocks })
    )

    this.blockDownloader.onNewBlocks((blocks) =>
      this.dispatch({ type: 'newBlocks', blocks })
    )

    this.blockDownloader.onReorg((blocks) =>
      this.dispatch({ type: 'reorg', blocks })
    )
  }
}
