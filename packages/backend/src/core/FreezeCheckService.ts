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
      await this.keyValueStore.addOrUpdate({
        key: 'freezeStatus',
        value: 'not-frozen',
      })
      return
    }

    const [isFrozen, freezeGracePeriod, tipBlockTimestamp] = await Promise.all([
      this.callIsFrozen(),
      this.fetchFreezeGracePeriod(),
      this.ethereumClient.getBlockTimestamp('latest'),
    ])

    if (isFrozen) {
      this.logger.critical('StarkEx is frozen!')
      await this.keyValueStore.addOrUpdate({
        key: 'freezeStatus',
        value: 'frozen',
      })
      return
    }

    const oldestNotIncludedForcedAction =
      await this.findOldestNotIncludedForcedAction()
    if (!oldestNotIncludedForcedAction) {
      await this.keyValueStore.addOrUpdate({
        key: 'freezeStatus',
        value: 'not-frozen',
      })
      return
    }

    const latestNonFreezableTimestamp =
      Timestamp.toSeconds(oldestNotIncludedForcedAction.timestamp) +
      BigInt(freezeGracePeriod)

    if (latestNonFreezableTimestamp > tipBlockTimestamp) {
      await this.keyValueStore.addOrUpdate({
        key: 'freezeStatus',
        value: 'not-frozen',
      })
      return // We're still in the grace period
    }

    // TODO: check if we're truly synced (lastSyncedBlockNumber is not further than an hour(?) behind)
    this.logger.critical('StarkEx is freezable!')
    await this.keyValueStore.addOrUpdate({
      key: 'freezeStatus',
      value: 'freezable',
    })
  }

  public async findOldestNotIncludedForcedAction() {
    return this.userTransactionRepository.findOldestNotIncluded([
      'ForcedTrade',
      'ForcedWithdrawal',
      'FullWithdrawal',
    ])
  }

  private async callIsFrozen(): Promise<boolean> {
    const [isFrozen, err] = await this.ethereumClient.call<boolean>(
      this.perpetualContractAddress,
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
        this.perpetualContractAddress,
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
