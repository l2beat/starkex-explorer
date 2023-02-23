import {
  renderUserAssetsPage,
  renderUserBalanceChangesPage,
  renderUserPage,
  UserAssetEntry,
  UserTransactionEntry,
} from '@explorer/frontend'
import { UserBalanceChangeEntry } from '@explorer/frontend/src/view/pages/user/components/UserBalanceChangesTable'
import { UserDetails } from '@explorer/shared'
import { AssetHash, AssetId, EthereumAddress, StarkKey } from '@explorer/types'

import { CollateralAsset } from '../../config/starkex/StarkexConfig'
import { UserService } from '../../core/UserService'
import { PaginationOptions } from '../../model/PaginationOptions'
import {
  PreprocessedAssetHistoryRecord,
  PreprocessedAssetHistoryRepository,
} from '../../peripherals/database/PreprocessedAssetHistoryRepository'
import {
  UserTransactionRecord,
  UserTransactionRepository,
} from '../../peripherals/database/transactions/UserTransactionRepository'
import { ControllerResult } from './ControllerResult'

const ETHEREUM_TRANSACTION_TYPES = [
  'ForcedTrade' as const,
  'ForcedWithdrawal' as const,
  'FullWithdrawal' as const,
  'Withdraw' as const,
]

export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly preprocessedAssetHistoryRepository: PreprocessedAssetHistoryRepository<
      AssetHash | AssetId
    >,
    private userTransactionRepository: UserTransactionRepository,
    private readonly collateralAsset?: CollateralAsset
  ) {}

  async getUserPage(
    givenUser: Partial<UserDetails>,
    starkKey: StarkKey
  ): Promise<ControllerResult> {
    const user = await this.userService.getUserDetails(givenUser)

    const [userAssets, totalAssets, history, historyCount, userTransactions] =
      await Promise.all([
        this.preprocessedAssetHistoryRepository.getCurrentByStarkKeyPaginated(
          starkKey,
          { offset: 0, limit: 10 },
          this.collateralAsset?.assetId
        ),
        this.preprocessedAssetHistoryRepository.getCountOfCurrentByStarkKey(
          starkKey
        ),
        this.preprocessedAssetHistoryRepository.getByStarkKeyPaginated(
          starkKey,
          { offset: 0, limit: 10 }
        ),
        this.preprocessedAssetHistoryRepository.getCountByStarkKey(starkKey),
        this.userTransactionRepository.getPaginatedByStarkKey({
          starkKey,
          offset: 0,
          limit: 10,
          types: ETHEREUM_TRANSACTION_TYPES, // TODO: this is not respected! I get 'Withdraw' type when not requested!
        }),
      ])

    const assetEntries = toUserAssetEntries(
      userAssets,
      this.collateralAsset?.assetId
    )
    const balanceChangesEntries = toUserBalanceChangeEntries(history)
    const userTransactionEntries =
      toUserTransactionEntries(userTransactions).filter(Boolean) // TODO. removing undefined - this should not be necessary

    const content = renderUserPage({
      user,
      type: 'PERPETUAL',
      starkKey,
      ethereumAddress: EthereumAddress.ZERO,
      withdrawableAssets: [],
      offersToAccept: [],
      assets: assetEntries,
      totalAssets,
      balanceChanges: balanceChangesEntries,
      totalBalanceChanges: historyCount,
      transactions: userTransactionEntries,
      totalTransactions: 0,
      offers: [],
      totalOffers: 0,
    })

    return { type: 'success', content }
  }

  async getUserAssetsPage(
    givenUser: Partial<UserDetails>,
    starkKey: StarkKey,
    pagination: PaginationOptions
  ): Promise<ControllerResult> {
    const user = await this.userService.getUserDetails(givenUser)

    const [userAssets, total] = await Promise.all([
      this.preprocessedAssetHistoryRepository.getCurrentByStarkKeyPaginated(
        starkKey,
        pagination,
        this.collateralAsset?.assetId
      ),
      this.preprocessedAssetHistoryRepository.getCountOfCurrentByStarkKey(
        starkKey
      ),
    ])

    const assets = toUserAssetEntries(userAssets, this.collateralAsset?.assetId)

    const content = renderUserAssetsPage({
      user,
      type: 'PERPETUAL',
      starkKey,
      assets,
      ...pagination,
      total,
    })
    return { type: 'success', content }
  }

  async getUserBalanceChangesPage(
    givenUser: Partial<UserDetails>,
    starkKey: StarkKey,
    pagination: PaginationOptions
  ): Promise<ControllerResult> {
    const user = await this.userService.getUserDetails(givenUser)

    const [history, total] = await Promise.all([
      this.preprocessedAssetHistoryRepository.getByStarkKeyPaginated(
        starkKey,
        pagination
      ),
      this.preprocessedAssetHistoryRepository.getCountByStarkKey(starkKey),
    ])

    const balanceChanges = toUserBalanceChangeEntries(history)

    const content = renderUserBalanceChangesPage({
      user,
      type: 'PERPETUAL',
      starkKey,
      balanceChanges,
      ...pagination,
      total,
    })

    return { type: 'success', content }
  }
}

function toUserAssetEntries(
  userAssets: PreprocessedAssetHistoryRecord<AssetHash | AssetId>[],
  collateralAssetId?: AssetId
): UserAssetEntry[] {
  return userAssets.map(
    (r): UserAssetEntry => ({
      asset: { hashOrId: r.assetHashOrId },
      balance: r.balance,
      value: r.price !== undefined ? r.price * (r.balance / 1000000n) : 0n, // temporary assumption of quantum=6
      vaultOrPositionId: r.positionOrVaultId.toString(),
      action: r.assetHashOrId === collateralAssetId ? 'WITHDRAW' : 'CLOSE',
    })
  )
}

function toUserBalanceChangeEntries(
  history: PreprocessedAssetHistoryRecord<AssetHash | AssetId>[]
): UserBalanceChangeEntry[] {
  return history.map(
    (r): UserBalanceChangeEntry => ({
      timestamp: r.timestamp,
      stateUpdateId: r.stateUpdateId.toString(),
      asset: { hashOrId: r.assetHashOrId },
      balance: r.balance,
      change: r.balance - r.prevBalance,
      vaultOrPositionId: r.positionOrVaultId.toString(),
    })
  )
}

function toUserTransactionEntries(
  records: UserTransactionRecord[]
): UserTransactionEntry[] {
  return records.map((record) => {
    const data = record.data
    switch (data.type) {
      case 'ForcedTrade':
        return {
          timestamp: record.timestamp,
          hash: record.transactionHash,
          asset: { hashOrId: data.syntheticAssetId },
          amount: data.syntheticAmount,
          status: record.included ? 'INCLUDED (3/3)' : 'MINED (2/3)',
          type: data.isABuyingSynthetic ? 'Forced buy' : 'Forced sell',
        }
      case 'ForcedWithdrawal':
        return {
          timestamp: record.timestamp,
          hash: record.transactionHash,
          // TODO: not always USDC
          asset: { hashOrId: AssetId.USDC },
          amount: data.quantizedAmount,
          status: record.included ? 'INCLUDED (3/3)' : 'MINED (2/3)',
          type: 'Forced withdraw',
        }
      case 'Withdraw':
        return {
          timestamp: record.timestamp,
          hash: record.transactionHash,
          // TODO: not always USDC
          asset: { hashOrId: AssetId.USDC },
          amount: data.quantizedAmount,
          status: record.included ? 'SENT (1/2)' : 'MINED (2/2)',
          type: 'Withdraw',
        }
      case 'FullWithdrawal':
        // TODO: assets, amount is unknown
        throw new Error('Not implemented')

      // TODO: other types return undefined....
    }
  })
}
