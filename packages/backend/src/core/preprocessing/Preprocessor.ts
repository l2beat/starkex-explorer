import { PreprocessedStateUpdateRepository } from '../../peripherals/database/PreprocessedStateUpdateRepository'
import { StateUpdateRepository } from '../../peripherals/database/StateUpdateRepository'
import { SyncStatusRepository } from '../../peripherals/database/SyncStatusRepository'
import { Logger } from '../../tools/Logger'
import { PerpetualHistoryPreprocessor } from './PerpetualHistoryPreprocessor'

export type SyncDirection = 'forward' | 'backward' | 'stop'

export class Preprocessor {
  constructor(
    private preprocessedStateUpdateRepository: PreprocessedStateUpdateRepository,
    private syncStatusRepository: SyncStatusRepository,
    private stateUpdateRepository: StateUpdateRepository,
    private perpetualHistoryPreprocessor: PerpetualHistoryPreprocessor,
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
    const lastStateUpdateId = await this.syncStatusRepository.getLastSynced()
    const lastProcessedStateUpdate =
      await this.preprocessedStateUpdateRepository.findLast()

    // 1. Handle simple cases of empty state updates and empty preprocessed
    // state updates.

    if (lastStateUpdateId === undefined) {
      return lastProcessedStateUpdate === undefined ? 'stop' : 'backward'
    }
    if (lastProcessedStateUpdate === undefined) {
      return 'forward'
    }

    // 2. Move back when current id is behind or there's hash mismatch,
    // (due to reorg), or throw on missing state update.

    if (lastStateUpdateId < lastProcessedStateUpdate.stateUpdateId) {
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

    if (lastStateUpdateId > lastProcessedStateUpdate.stateUpdateId) {
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
        await this.perpetualHistoryPreprocessor.preprocessNextStateUpdate(
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
        await this.perpetualHistoryPreprocessor.rollbackOneStateUpdate(trx)

        await this.preprocessedStateUpdateRepository.deleteByStateUpdateId(
          lastProcessedStateUpdate.stateUpdateId,
          trx
        )

        // END TRANSACTION
      }
    )
  }
}
