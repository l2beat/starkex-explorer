import { BlockRange } from '../../model'
import { KeyValueStore } from '../../peripherals/database/KeyValueStore'
import { WithdrawableAssetRepository } from '../../peripherals/database/WithdrawableAssetRepository'
import { Logger } from '../../tools/Logger'
import { UserTransactionCollector } from '../collectors/UserTransactionCollector'
import { WithdrawalAllowedCollector } from '../collectors/WithdrawalAllowedCollector'

// Technically this is not a migrator, but a catch-up on all the events
// that happened until now to build the withdrawable assets repository.
export class WithdrawableAssetMigrator {
  constructor(
    private kvStore: KeyValueStore,
    private withdrawableAssetRepository: WithdrawableAssetRepository,
    private withdrawalAllowedCollector: WithdrawalAllowedCollector,
    private userTransactionCollector: UserTransactionCollector,
    private logger: Logger
  ) {
    this.logger = this.logger.for(this)
  }

  async migrate(): Promise<void> {
    const migrationNumber =
      (await this.kvStore.findByKey('softwareMigrationNumber')) ?? 0
    if (migrationNumber >= 4) {
      return
    }
    await this.migrateWithdrawableAssets()
    // Migration is set to 4 because there were previous migrations
    // that had since been replaced by this one.
    await this.kvStore.addOrUpdate({
      key: 'softwareMigrationNumber',
      value: 4,
    })
  }

  private async migrateWithdrawableAssets() {
    const lastSyncedBlock = await this.kvStore.findByKey(
      'lastBlockNumberSynced'
    )
    if (lastSyncedBlock === undefined) {
      return
    }
    this.logger.info('Withdrawable assets buildup started')

    await this.clearRepositories()
    await this.collectWithdrawableAssetEvents(lastSyncedBlock)

    this.logger.info('Buildup finished')
  }

  private async clearRepositories() {
    await this.withdrawableAssetRepository.deleteAll()
    this.logger.info('Cleared ')
  }

  private async collectWithdrawableAssetEvents(lastSyncedBlock: number) {
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
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const timestamps = require('./blockTimestamps.json') as Record<
      number,
      number
    >
    const knownBlockTimestamps = new Map<number, number>(
      Object.entries(timestamps).map(([k, v]) => [parseInt(k), v])
    )
    // This collector collects withdrawals allowed
    await this.withdrawalAllowedCollector.collect(
      blockRange,
      knownBlockTimestamps
    )
    // This collector collects withdrawals performed
    await this.userTransactionCollector.collect(
      blockRange,
      knownBlockTimestamps,
      {
        skipUserTransactionRepository: true,
        skipWithdrawableAssetRepository: false,
      }
    )
  }
}
