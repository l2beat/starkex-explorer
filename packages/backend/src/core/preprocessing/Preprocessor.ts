import { PreprocessedStateUpdateRepository } from '../../peripherals/database/PreprocessedStateUpdateRepository'
import {
  StateUpdateRecord,
  StateUpdateRepository,
} from '../../peripherals/database/StateUpdateRepository'
import { SyncStatusRepository } from '../../peripherals/database/SyncStatusRepository'
import { Logger } from '../../tools/Logger'
import { HistoryPreprocessor } from './HistoryPreprocessor'

export type SyncDirection = 'forward' | 'backward' | 'stop'

export class Preprocessor {
  constructor(
    private preprocessedStateUpdateRepository: PreprocessedStateUpdateRepository,
    private syncStatusRepository: SyncStatusRepository,
    private stateUpdateRepository: StateUpdateRepository,
    private historyPreprocessor: HistoryPreprocessor,
    private logger: Logger
  ) {
    this.logger = this.logger.for(this)
  }

  async sync() {
    let direction: SyncDirection

    do {
      direction = await this.calculateRequiredSyncDirection()
      if (direction === 'forward') {
        await this.preprocessNextStateUpdate()
      } else if (direction === 'backward') {
        await this.rollbackOneStateUpdate()
      }
      // process.exit(1)
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
        await this.historyPreprocessor.preprocessNextStateUpdate(
          trx,
          nextStateUpdate
        )

        await this.preprocessedStateUpdateRepository.add(
          {
            stateUpdateId: nextStateUpdate.id,
            stateTransitionHash: nextStateUpdate.stateTransitionHash,
          },
          trx
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
        await this.historyPreprocessor.rollbackOneStateUpdate(
          trx,
          lastProcessedStateUpdate
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
