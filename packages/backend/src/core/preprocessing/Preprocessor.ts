import { AssetHash, AssetId } from '@explorer/types'

import { PreprocessedStateUpdateRepository } from '../../peripherals/database/PreprocessedStateUpdateRepository'
import {
  StateUpdateRecord,
  StateUpdateRepository,
} from '../../peripherals/database/StateUpdateRepository'
import { SyncStatusRepository } from '../../peripherals/database/SyncStatusRepository'
import { Logger } from '../../tools/Logger'
import { HistoryPreprocessor } from './HistoryPreprocessor'
import { StateDetailsPreprocessor } from './StateDetailsPreprocessor'
import { UserStatisticsPreprocessor } from './UserStatisticsPreprocessor'

export type SyncDirection = 'forward' | 'backward' | 'stop'

export class Preprocessor<T extends AssetHash | AssetId> {
  constructor(
    private preprocessedStateUpdateRepository: PreprocessedStateUpdateRepository,
    private syncStatusRepository: SyncStatusRepository,
    private stateUpdateRepository: StateUpdateRepository,
    private historyPreprocessor: HistoryPreprocessor<T>,
    private stateDetailsPreprocessor: StateDetailsPreprocessor,
    private userStatisticsPreprocessor: UserStatisticsPreprocessor,
    private logger: Logger,
    private isEnabled: boolean = true
  ) {
    this.logger = this.logger.for(this)
  }

  async sync() {
    if (!this.isEnabled) {
      this.logger.info('Preprocessor is disabled, skipping sync')
      return
    }
    let direction: SyncDirection

    do {
      direction = await this.calculateRequiredSyncDirection()
      if (direction === 'forward') {
        await this.preprocessNextStateUpdate()
      } else if (direction === 'backward') {
        await this.rollbackOneStateUpdate()
      }
    } while (direction !== 'stop')
  }

  async getLastSyncedStateUpdate(): Promise<StateUpdateRecord | undefined> {
    const lastSyncedBlock = await this.syncStatusRepository.getLastSynced()
    if (lastSyncedBlock === undefined) {
      return
    }
    return await this.stateUpdateRepository.findLastUntilBlockNumber(
      lastSyncedBlock
    )
  }

  // Preprocessor can move only one state-update forward or backward. This
  // function returns the required direction of the next move.
  //
  // It's not enough to just compare the last processed-state-update id with the
  // last state-update id because if reorg has happened, state-update id might
  // have caught up and be the same (it's a sequential number).
  //
  // That's why state transition hash is also compared.  In general, this
  // function moves backward until it finds a "common" state update, with the
  // same id and state transition hash. Then it moves forward.
  async calculateRequiredSyncDirection(): Promise<SyncDirection> {
    const lastStateUpdate = await this.getLastSyncedStateUpdate()
    const lastProcessedStateUpdate =
      await this.preprocessedStateUpdateRepository.findLast()

    // 1. Handle simple cases of empty state updates and empty preprocessed
    // state updates.

    if (lastStateUpdate === undefined) {
      return lastProcessedStateUpdate === undefined ? 'stop' : 'backward'
    }
    if (lastProcessedStateUpdate === undefined) {
      return 'forward'
    }

    // 2. Move back when current id is behind or there's hash mismatch,
    // (due to reorg), or throw on missing state update.

    if (lastStateUpdate.id < lastProcessedStateUpdate.stateUpdateId) {
      return 'backward'
    }

    const correspondingStateUpdate = await this.stateUpdateRepository.findById(
      lastProcessedStateUpdate.stateUpdateId
    )
    if (correspondingStateUpdate === undefined) {
      throw new Error('Missing expected state update during Preprocessor sync')
    }

    if (
      correspondingStateUpdate.stateTransitionHash !==
      lastProcessedStateUpdate.stateTransitionHash
    ) {
      // Reorg happened
      return 'backward'
    }

    // 3. If all is ok and we're behind, move forward

    if (lastStateUpdate.id > lastProcessedStateUpdate.stateUpdateId) {
      return 'forward'
    }

    return 'stop'
  }

  async catchUp() {
    await this.preprocessedStateUpdateRepository.runInTransaction(
      async (trx) => {
        await this.userStatisticsPreprocessor.catchUp(trx)
      }
    )
  }

  async preprocessNextStateUpdate() {
    await this.preprocessedStateUpdateRepository.runInTransaction(
      async (trx) => {
        // BEGIN TRANSACTION

        const lastProcessedStateUpdate =
          await this.preprocessedStateUpdateRepository.findLast(trx)
        const nextStateUpdateId =
          (lastProcessedStateUpdate?.stateUpdateId ?? 0) + 1
        const nextStateUpdate = await this.stateUpdateRepository.findById(
          nextStateUpdateId,
          trx
        )
        if (nextStateUpdate === undefined) {
          throw new Error(
            `Preprocessing was requested, but next state update (${nextStateUpdateId}) is missing`
          )
        }

        this.logger.info(`Preprocessing state update ${nextStateUpdate.id}`)
        await this.preprocessedStateUpdateRepository.add(
          {
            stateUpdateId: nextStateUpdate.id,
            stateTransitionHash: nextStateUpdate.stateTransitionHash,
          },
          trx
        )

        await this.historyPreprocessor.preprocessNextStateUpdate(
          trx,
          nextStateUpdate
        )
        // This one needs to be called *after* historyPreprocessor was run
        // Don't use Promise.all!
        await this.stateDetailsPreprocessor.preprocessNextStateUpdate(
          trx,
          nextStateUpdate
        )
        // This one needs to be called *after* historyPreprocessor was run
        // Don't use Promise.all!
        await this.userStatisticsPreprocessor.preprocessNextStateUpdate(
          trx,
          nextStateUpdate
        )

        // We cannot assume that Feeder and Availability Gateway are in sync
        // with the state updates. We need to catch up with L2 transactions
        // after each state update to make sure it is preprocessed as far as possible.
        await this.stateDetailsPreprocessor.catchUpL2Transactions(
          trx,
          nextStateUpdate.id
        )
        await this.userStatisticsPreprocessor.catchUpL2Transactions(
          trx,
          nextStateUpdate.id
        )
        // END TRANSACTION
      }
    )
  }

  async rollbackOneStateUpdate() {
    await this.preprocessedStateUpdateRepository.runInTransaction(
      async (trx) => {
        // BEGIN TRANSACTION

        const lastProcessedStateUpdate =
          await this.preprocessedStateUpdateRepository.findLast(trx)

        if (lastProcessedStateUpdate === undefined) {
          throw new Error(
            'Preprocessing rollback was requested, but there is nothing to roll back'
          )
        }

        this.logger.info(
          `Rolling back preprocessing of state update ${lastProcessedStateUpdate.stateUpdateId}`
        )

        await this.userStatisticsPreprocessor.rollbackOneStateUpdate(
          trx,
          lastProcessedStateUpdate.stateUpdateId
        )
        await this.historyPreprocessor.rollbackOneStateUpdate(
          trx,
          lastProcessedStateUpdate.stateUpdateId
        )
        await this.stateDetailsPreprocessor.rollbackOneStateUpdate(
          trx,
          lastProcessedStateUpdate.stateUpdateId
        )

        await this.preprocessedStateUpdateRepository.deleteByStateUpdateId(
          lastProcessedStateUpdate.stateUpdateId,
          trx
        )

        // END TRANSACTION
      }
    )
  }
}
