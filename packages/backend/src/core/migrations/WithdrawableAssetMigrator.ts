import { BlockRange } from '../../model'
import { SoftwareMigrationRepository } from '../../peripherals/database/SoftwareMigrationRepository'
import { SyncStatusRepository } from '../../peripherals/database/SyncStatusRepository'
import { WithdrawableAssetRepository } from '../../peripherals/database/WithdrawableAssetRepository'
import { Logger } from '../../tools/Logger'
import { WithdrawalAllowedCollector } from '../collectors/WithdrawalAllowedCollector'

export class WithdrawableAssetMigrator {
  constructor(
    private softwareMigrationRepository: SoftwareMigrationRepository,
    private syncStatusRepository: SyncStatusRepository,
    private withdrawableAssetRepository: WithdrawableAssetRepository,
    private withdrawalAllowedCollector: WithdrawalAllowedCollector,
    private logger: Logger
  ) {
    this.logger = this.logger.for(this)
  }

  async migrate(): Promise<void> {
    const migrationNumber =
      await this.softwareMigrationRepository.getMigrationNumber()
    if (migrationNumber !== 2) {
      return
    }
    await this.migrateWithdrawableAssets()
    await this.softwareMigrationRepository.setMigrationNumber(3)
  }

  private async migrateWithdrawableAssets() {
    const lastSyncedBlock = await this.syncStatusRepository.getLastSynced()
    if (lastSyncedBlock === undefined) {
      return
    }
    this.logger.info('Withdrawable assets migration started')

    await this.clearRepositories()
    await this.collectWithdrawableAssetEvents(lastSyncedBlock)

    this.logger.info('Migration finished')
  }

  private async clearRepositories() {
    await this.withdrawableAssetRepository.deleteAll()
    this.logger.info('Cleared repositories')
  }

  private async collectWithdrawableAssetEvents(lastSyncedBlock: number) {
    const blockRange = new BlockRange([], 0, lastSyncedBlock)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const timestamps = require('./blockTimestamps.json') as Record<
      number,
      number
    >
    const knownBlockTimestamps = new Map<number, number>(
      Object.entries(timestamps).map(([k, v]) => [parseInt(k), v])
    )
    await this.withdrawalAllowedCollector.collect(
      blockRange,
      knownBlockTimestamps
    )
    this.logger.info('Collected withdrawable asset events')
  }
}
