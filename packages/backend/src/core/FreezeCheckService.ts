import { EthereumAddress, Timestamp } from '@explorer/types'
import { ethers } from 'ethers'

import { KeyValueStore } from '../peripherals/database/KeyValueStore'
import { SyncStatusRepository } from '../peripherals/database/SyncStatusRepository'
import { UserTransactionRepository } from '../peripherals/database/transactions/UserTransactionRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { Logger } from '../tools/Logger'

export class FreezeCheckService {
  constructor(
    private readonly perpatualContractAddress: EthereumAddress,
    private readonly ethereumClient: EthereumClient,
    private readonly keyValueStore: KeyValueStore,
    private readonly syncStatusRepository: SyncStatusRepository,
    private readonly userTransactionRepository: UserTransactionRepository,
    private readonly logger: Logger
  ) {
    this.logger = logger.for(this)
  }

  async updateFreezeStatus() {
    const lastSyncedBlockNumber =
      await this.syncStatusRepository.getLastSynced()
    if (!lastSyncedBlockNumber) {
      this.logger.error(
        'Ignoring freeze-check - no last synced block number found'
      )
      await this.keyValueStore.setFreezeStatus('not-frozen')
      return
    }

    const [isFrozen, freezeGracePeriod, curBlockTimestamp] = await Promise.all([
      this.callIsFrozen(),
      this.fetchFreezeGracePeriod(),
      this.ethereumClient.getBlockTimestamp('latest'),
    ])

    if (isFrozen) {
      this.logger.info('StarkEx is frozen!')
      await this.keyValueStore.setFreezeStatus('frozen')
      return
    }

    const oldestNotIncludedForcedAction =
      await this.userTransactionRepository.findOldestNotIncluded([
        'ForcedTrade',
        'ForcedWithdrawal',
        'FullWithdrawal',
      ])
    if (!oldestNotIncludedForcedAction) {
      await this.keyValueStore.setFreezeStatus('not-frozen')
      return
    }

    const latestNonFreezableTimestamp =
      Timestamp.toSeconds(oldestNotIncludedForcedAction.timestamp) +
      BigInt(freezeGracePeriod)

    if (latestNonFreezableTimestamp > curBlockTimestamp) {
      await this.keyValueStore.setFreezeStatus('not-frozen')
      return // We're still in the grace period
    }

    // TODO: check if we're truly synced (lastSyncedBlockNumber is not further than an hour(?) behind)
    this.logger.info('StarkEx is freezable!')
    await this.keyValueStore.setFreezeStatus('freezable')
  }

  private async callIsFrozen(): Promise<boolean> {
    const [isFrozen, err] = await this.ethereumClient.call<boolean>(
      this.perpatualContractAddress,
      'isFrozen',
      'function isFrozen() public view returns (bool)'
    )
    if (err) {
      this.logger.error('Failed calling isFrozen():', err)
      throw err
    }
    if (isFrozen === undefined) {
      throw new Error(`Failed calling isFrozen(): received undefined`)
    }
    return isFrozen
  }

  private async fetchFreezeGracePeriod(): Promise<number> {
    const [freezeGracePeriod, err] =
      await this.ethereumClient.call<ethers.BigNumber>(
        this.perpatualContractAddress,
        'FREEZE_GRACE_PERIOD',
        'function FREEZE_GRACE_PERIOD() view returns (uint256)'
      )
    if (err) {
      this.logger.error(`Failed calling FREEZE_GRACE_PERIOD()`)
      throw err
    }
    if (freezeGracePeriod === undefined) {
      throw new Error(
        `Failed calling FREEZE_GRACE_PERIOD(): received undefined`
      )
    }
    return freezeGracePeriod.toNumber()
  }
}