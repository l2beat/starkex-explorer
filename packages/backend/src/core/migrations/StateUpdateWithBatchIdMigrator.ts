import { BlockRange } from '../../model'
import { SoftwareMigrationRepository } from '../../peripherals/database/SoftwareMigrationRepository'
import { StateUpdateRepository } from '../../peripherals/database/StateUpdateRepository'
import { SyncStatusRepository } from '../../peripherals/database/SyncStatusRepository'
import { Logger } from '../../tools/Logger'
import { IStateTransitionCollector } from '../IStateTransitionCollector'

export class StateUpdateWithBatchIdMigrator {
  constructor(
    private softwareMigrationRepository: SoftwareMigrationRepository,
    private stateUpdateRepository: StateUpdateRepository,
    private syncStatusRepository: SyncStatusRepository,
    private transitionCollector: IStateTransitionCollector,
    private logger: Logger
  ) {
    this.logger = this.logger.for(this)
  }

  async migrate(): Promise<void> {
    const migrationNumber =
      await this.softwareMigrationRepository.getMigrationNumber()
    if (migrationNumber >= 5) {
      return
    }
    await this.migrateStateUpdates()
    await this.softwareMigrationRepository.setMigrationNumber(5)
  }

  private async migrateStateUpdates() {
    const lastSyncedBlock = await this.syncStatusRepository.getLastSynced()
    if (lastSyncedBlock === undefined) {
      return
    }
    this.logger.info('Migration assigning batch ids to state updates started')

    await this.collectStateUpdateEvents(lastSyncedBlock)

    this.logger.info('Migration finished')
  }

  private async collectStateUpdateEvents(lastSyncedBlock: number) {
    // A quick hack to lower the amount of events processed in one go
    // due to "Reached heap limit" error on Heroku
    const deltaBlocks = 500000
    let firstBlock = 0
    while (firstBlock < lastSyncedBlock) {
      const lastBlock = Math.min(firstBlock + deltaBlocks, lastSyncedBlock)
      await this.collectInRange(firstBlock, lastBlock)
      firstBlock = lastBlock + 1
    }
    this.logger.info('Collection finished')
  }

  private async collectInRange(firstBlock: number, lastBlock: number) {
    this.logger.info(`Collecting in range ${firstBlock} - ${lastBlock}`)
    const blockRange = new BlockRange([], firstBlock, lastBlock)
    const stateTransitions = await this.transitionCollector.collect(
      blockRange,
      true
    )
    for (const stateTransition of stateTransitions) {
      await this.stateUpdateRepository.update({
        id: stateTransition.sequenceNumber + 1,
        batchId: stateTransition.batchId,
      })
    }
  }
}
