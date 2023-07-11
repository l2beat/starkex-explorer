import { EthereumAddress, Timestamp } from '@explorer/types'
import { ethers } from 'ethers'

import { SyncStatusRepository } from '../peripherals/database/SyncStatusRepository'
import { UserTransactionRepository } from '../peripherals/database/transactions/UserTransactionRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { Logger } from '../tools/Logger'

export class FreezeCheckService {
  constructor(
    private readonly perpatualContractAddress: EthereumAddress,
    private readonly ethereumClient: EthereumClient,
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
      return
    }

    const [isFrozen, freezeGracePeriod, curBlockTimestamp] = await Promise.all([
      this.checkIsFrozen(),
      this.fetchFreezeGracePeriod(),
      this.ethereumClient.getBlockTimestamp('latest'),
    ])

    if (isFrozen) {
      // TODO: update db!!
      console.log('Were FROZEN!')
      return
    }

    const oldestNotIncludedForcedAction =
      await this.userTransactionRepository.findOldestNotIncluded([
        'ForcedTrade',
        'ForcedWithdrawal',
        'FullWithdrawal',
      ])
    if (!oldestNotIncludedForcedAction) {
      return
    }

    const latestNonFreezableTimestamp =
      Timestamp.toSeconds(oldestNotIncludedForcedAction.timestamp) +
      BigInt(freezeGracePeriod)

    if (latestNonFreezableTimestamp > curBlockTimestamp) {
      return // We're still in the grace period
    }

    console.log('We are FREEZABLE!')
  }

  private async checkIsFrozen(): Promise<boolean> {
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
