import { FreezeStatus } from '@explorer/shared'
import { EthereumAddress, Timestamp } from '@explorer/types'
import { Logger } from '@l2beat/backend-tools'
import { ethers } from 'ethers'

import { KeyValueStore } from '../peripherals/database/KeyValueStore'
import { UserTransactionRepository } from '../peripherals/database/transactions/UserTransactionRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'

export class FreezeCheckService {
  constructor(
    private readonly perpetualContractAddress: EthereumAddress,
    private readonly ethereumClient: EthereumClient,
    private readonly keyValueStore: KeyValueStore,
    private readonly userTransactionRepository: UserTransactionRepository,
    private readonly logger: Logger
  ) {
    this.logger = logger.for(this)
  }

  async updateFreezeStatus() {
    const lastSyncedBlockNumber = await this.keyValueStore.findByKey(
      'lastBlockNumberSynced'
    )
    if (!lastSyncedBlockNumber) {
      this.logger.error(
        'Ignoring freeze-check - no last synced block number found'
      )
      await this.setFreezeStatus('not-frozen')
      return
    }

    const [isFrozen, freezeGracePeriod, tipBlockTimestamp] = await Promise.all([
      this.userTransactionRepository.freezeRequestExists(),
      this.fetchFreezeGracePeriod(),
      this.ethereumClient.getBlockTimestamp('latest'),
    ])

    if (isFrozen) {
      this.logger.critical('StarkEx is frozen!')
      await this.setFreezeStatus('frozen')
      return
    }

    const oldestNotIncludedForcedAction =
      await this.findOldestNotIncludedForcedAction()
    if (!oldestNotIncludedForcedAction) {
      await this.setFreezeStatus('not-frozen')
      return
    }

    const latestNonFreezableTimestamp =
      Timestamp.toSeconds(oldestNotIncludedForcedAction.timestamp) +
      BigInt(freezeGracePeriod)

    if (latestNonFreezableTimestamp > tipBlockTimestamp) {
      await this.setFreezeStatus('not-frozen')
      return // We're still in the grace period
    }

    // TODO: check if we're truly synced (lastSyncedBlockNumber is not further than an hour(?) behind)
    this.logger.critical('StarkEx is freezable!')
    await this.setFreezeStatus('freezable')
  }

  async setFreezeStatus(status: FreezeStatus) {
    await this.keyValueStore.addOrUpdate({
      key: 'freezeStatus',
      value: status,
    })
  }

  public async findOldestNotIncludedForcedAction() {
    return this.userTransactionRepository.findOldestNotIncluded([
      'ForcedTrade',
      'ForcedWithdrawal',
      'FullWithdrawal',
    ])
  }

  private async fetchFreezeGracePeriod(): Promise<number> {
    const [freezeGracePeriod, err] =
      await this.ethereumClient.call<ethers.BigNumber>(
        this.perpetualContractAddress,
        'FREEZE_GRACE_PERIOD',
        'function FREEZE_GRACE_PERIOD() view returns (uint256)'
      )
    if (err) {
      this.logger.error('Failed calling FREEZE_GRACE_PERIOD()')
      throw err
    }
    if (freezeGracePeriod === undefined) {
      throw new Error(
        'Failed calling FREEZE_GRACE_PERIOD(): received undefined'
      )
    }
    return freezeGracePeriod.toNumber()
  }
}
