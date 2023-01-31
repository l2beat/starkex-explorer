import { PreprocessedStateUpdateRepository } from '../../peripherals/database/PreprocessedStateUpdateRepository'
import { StateUpdateRepository } from '../../peripherals/database/StateUpdateRepository'
import { Logger } from '../../tools/Logger'

export type SyncDirection = 'forward' | 'backward' | 'not-needed'

export class Preprocessor {
  constructor(
    private preprocessedStateUpdateRepository: PreprocessedStateUpdateRepository,
    private stateUpdateRepository: StateUpdateRepository,
    private logger: Logger
  ) {
    this.logger = this.logger.for(this)
  }

  async sync() {
    let direction
    do {
      direction = await this.calculateRequiredSyncDirection()
      if (direction === 'forward') {
        await this.processNextStateUpdate()
      } else if (direction === 'backward') {
        await this.rollbackOneStateUpdate()
      }
    } while (direction !== 'not-needed')
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
    const lastStateUpdate = await this.stateUpdateRepository.findLast()
    const lastProcessedStateUpdate =
      await this.preprocessedStateUpdateRepository.findLast()

    // 1. Handle simple cases of empty state updates and empty preprocessed
    // state updates.

    if (lastStateUpdate === undefined) {
      return lastProcessedStateUpdate === undefined ? 'not-needed' : 'backward'
    }
    if (lastProcessedStateUpdate === undefined) {
      return 'forward'
    }

    // 2. Move back when current id is behind or there's hash mismatch,
    // (due to reorg), or throw on missing state update.

    if (lastStateUpdate.id < lastProcessedStateUpdate.stateUpdateId) {
      return 'backward'
    }

    const actualStateUpdate = await this.stateUpdateRepository.findById(
      lastProcessedStateUpdate.stateUpdateId
    )
    if (actualStateUpdate === undefined) {
      throw new Error('Missing expected state update during Preprocessor sync')
    }

    if (
      actualStateUpdate.stateTransitionHash !==
      lastProcessedStateUpdate.stateTransitionHash
    ) {
      // Reorg happened
      return 'backward'
    }

    // 3. If all is ok and we're behind, move forward

    if (lastStateUpdate.id > lastProcessedStateUpdate.stateUpdateId) {
      return 'forward'
    }

    return 'not-needed'
  }

  async processNextStateUpdate() {}
  async rollbackOneStateUpdate() {}
}
