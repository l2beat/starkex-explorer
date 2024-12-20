import {
  EscapableAssetEntry,
  renderUserAssetsPage,
  renderUserBalanceChangesPage,
  renderUserL2TransactionsPage,
  renderUserOffersPage,
  renderUserPage,
  renderUserRecoverPage,
  renderUserRegisterPage,
  renderUserTransactionsPage,
  TransactionEntry,
  UserAssetEntry,
  WithdrawableAssetEntry,
} from '@explorer/frontend'
import { UserBalanceChangeEntry } from '@explorer/frontend/src/view/pages/user/components/UserBalanceChangesTable'
import {
  CollateralAsset,
  FreezeStatus,
  PageContext,
  TradingMode,
  UserDetails,
} from '@explorer/shared'
import { MerkleProof, PositionLeaf } from '@explorer/state'
import { AssetHash, AssetId, EthereumAddress, StarkKey } from '@explorer/types'

import { L2TransactionTypesToExclude } from '../../config/starkex/StarkexConfig'
import { AssetDetailsMap } from '../../core/AssetDetailsMap'
import { AssetDetailsService } from '../../core/AssetDetailsService'
import { ForcedTradeOfferViewService } from '../../core/ForcedTradeOfferViewService'
import { PageContextService } from '../../core/PageContextService'
import { StateUpdater } from '../../core/StateUpdater'
import { PaginationOptions } from '../../model/PaginationOptions'
import { ForcedTradeOfferRepository } from '../../peripherals/database/ForcedTradeOfferRepository'
import { L2TransactionRepository } from '../../peripherals/database/L2TransactionRepository'
import {
  PreprocessedAssetHistoryRecord,
  PreprocessedAssetHistoryRepository,
} from '../../peripherals/database/PreprocessedAssetHistoryRepository'
import { sumUpTransactionCount } from '../../peripherals/database/PreprocessedL2TransactionsStatistics'
import { PreprocessedUserL2TransactionsStatisticsRepository } from '../../peripherals/database/PreprocessedUserL2TransactionsStatisticsRepository'
import { PreprocessedUserStatisticsRepository } from '../../peripherals/database/PreprocessedUserStatisticsRepository'
import {
  PricesRecord,
  PricesRepository,
} from '../../peripherals/database/PricesRepository'
import { StateUpdateRepository } from '../../peripherals/database/StateUpdateRepository'
import {
  SentTransactionRecord,
  SentTransactionRepository,
} from '../../peripherals/database/transactions/SentTransactionRepository'
import {
  UserTransactionRecord,
  UserTransactionRepository,
} from '../../peripherals/database/transactions/UserTransactionRepository'
import { UserRegistrationEventRepository } from '../../peripherals/database/UserRegistrationEventRepository'
import { VaultRepository } from '../../peripherals/database/VaultRepository'
import { WithdrawableAssetRepository } from '../../peripherals/database/WithdrawableAssetRepository'
import { getAssetValueUSDCents } from '../../utils/assets'
import {
  calculatePositionValue,
  PositionValue,
} from '../../utils/calculatePositionValue'
import { ControllerResult } from './ControllerResult'
import { getCollateralAssetDetails } from './getCollateralAssetDetails'
import { EscapableMap, getEscapableAssets } from './getEscapableAssets'
import { l2TransactionToEntry } from './l2TransactionToEntry'
import { sentTransactionToEntry } from './sentTransactionToEntry'
import { userTransactionToEntry } from './userTransactionToEntry'

export class UserController {
  constructor(
    private readonly pageContextService: PageContextService,
    private readonly assetDetailsService: AssetDetailsService,
    private readonly preprocessedAssetHistoryRepository: PreprocessedAssetHistoryRepository,
    private readonly pricesRepository: PricesRepository,
    private readonly sentTransactionRepository: SentTransactionRepository,
    private readonly userTransactionRepository: UserTransactionRepository,
    private readonly forcedTradeOfferRepository: ForcedTradeOfferRepository,
    private readonly l2TransactionRepository: L2TransactionRepository,
    private readonly userRegistrationEventRepository: UserRegistrationEventRepository,
    private readonly forcedTradeOfferViewService: ForcedTradeOfferViewService,
    private readonly withdrawableAssetRepository: WithdrawableAssetRepository,
    private readonly preprocessedUserStatisticsRepository: PreprocessedUserStatisticsRepository,
    private readonly preprocessedUserL2TransactionsStatisticsRepository: PreprocessedUserL2TransactionsStatisticsRepository,
    private readonly vaultRepository: VaultRepository,
    private readonly excludeL2TransactionTypes:
      | L2TransactionTypesToExclude
      | undefined,
    private readonly exchangeAddress: EthereumAddress,
    private readonly stateUpdater: StateUpdater,
    private readonly stateUpdateRepository: StateUpdateRepository
  ) {}

  async getUserRegisterPage(
    givenUser: Partial<UserDetails>
  ): Promise<ControllerResult> {
    const context =
      await this.pageContextService.getPageContextWithUserAndStarkKey(givenUser)

    if (!context) {
      return { type: 'redirect', url: '/users/recover' }
    }

    const registeredUser =
      await this.userRegistrationEventRepository.findByStarkKey(
        context.user.starkKey
      )

    if (registeredUser) {
      return {
        type: 'redirect',
        url: `/users/${context.user.starkKey.toString()}`,
      }
    }

    const content = renderUserRegisterPage({
      context,
      exchangeAddress: this.exchangeAddress,
    })

    return { type: 'success', content }
  }

  async getUserRecoverPage(
    givenUser: Partial<UserDetails>
  ): Promise<ControllerResult> {
    const context = await this.pageContextService.getPageContextWithUser(
      givenUser
    )

    if (!context) {
      return {
        type: 'not found',
        message: 'You have to connect a wallet to access this page',
      }
    }

    if (context.user.starkKey) {
      return {
        type: 'redirect',
        url: `/users/${context.user.starkKey.toString()}`,
      }
    }

    const recoveryDoneAutomatically = context.instanceName === 'dYdX'
    if (recoveryDoneAutomatically) {
      return {
        type: 'redirect',
        url: '/users/not-associated',
      }
    }

    const content = renderUserRecoverPage({
      context,
    })

    return { type: 'success', content }
  }

  async getUserPage(
    givenUser: Partial<UserDetails>,
    starkKey: StarkKey,
    performUserActions: boolean | undefined
  ): Promise<ControllerResult> {
    const context = await this.pageContextService.getPageContext(givenUser)
    const collateralAsset = this.pageContextService.getCollateralAsset(context)
    const paginationOpts = {
      offset: 0,
      limit: 10,
    }

    const [
      registeredUser,
      userAssets,
      assetPrices,
      history,
      l2Transactions,
      preprocessedUserL2TransactionsStatistics,
      liveL2TransactionStatistics,
      sentTransactions,
      userTransactions,
      userTransactionsCount,
      forcedTradeOffers,
      forcedTradeOffersCount,
      finalizableOffers,
      starkKeyWithdrawableAssets,
      userStatistics,
    ] = await Promise.all([
      this.userRegistrationEventRepository.findByStarkKey(starkKey),
      this.preprocessedAssetHistoryRepository.getCurrentByStarkKeyPaginated(
        starkKey,
        paginationOpts,
        collateralAsset?.assetId
      ),
      this.pricesRepository.getAllLatest(),
      this.preprocessedAssetHistoryRepository.getByStarkKeyPaginated(
        starkKey,
        paginationOpts
      ),
      this.l2TransactionRepository.getUserSpecificPaginated(
        starkKey,
        paginationOpts,
        this.excludeL2TransactionTypes
      ),
      this.preprocessedUserL2TransactionsStatisticsRepository.findLatestByStarkKey(
        starkKey
      ),
      this.l2TransactionRepository.getLiveStatisticsByStarkKey(starkKey),
      this.sentTransactionRepository.getByStarkKey(starkKey),
      this.userTransactionRepository.getByStarkKey(
        starkKey,
        undefined,
        paginationOpts
      ),
      this.userTransactionRepository.getCountByStarkKey(starkKey),
      this.forcedTradeOfferRepository.getByMakerOrTakerStarkKey(
        starkKey,
        paginationOpts
      ),
      this.forcedTradeOfferRepository.countByMakerOrTakerStarkKey(starkKey),
      this.forcedTradeOfferRepository.getFinalizableByStarkKey(starkKey),
      this.withdrawableAssetRepository.getAssetBalancesByStarkKey(starkKey),
      this.preprocessedUserStatisticsRepository.findCurrentByStarkKey(starkKey),
    ])

    const ethAddressWithdrawableAssets =
      starkKey === givenUser.starkKey && givenUser.address
        ? await this.withdrawableAssetRepository.getAssetBalancesByStarkKey(
            EthereumAddress.asStarkKey(givenUser.address)
          )
        : []

    const withdrawableAssets = [
      ...starkKeyWithdrawableAssets,
      ...ethAddressWithdrawableAssets,
    ]

    const escapableMap = await getEscapableAssets(
      this.userTransactionRepository,
      this.sentTransactionRepository,
      this.vaultRepository,
      context,
      starkKey,
      collateralAsset
    )

    const escapableAssetHashes: AssetHash[] = [
      ...Object.values(escapableMap).map((a) => a.assetHash),
    ]

    const assetDetailsMap = await this.assetDetailsService.getAssetDetailsMap({
      userAssets: userAssets,
      assetHistory: history,
      sentTransactions,
      userTransactions,
      withdrawableAssets,
      escapableAssetHashes,
    })

    // If escape process has started on perpetuals, hide all assets
    const hideAllAssets =
      context.freezeStatus === 'frozen' &&
      context.tradingMode === 'perpetual' &&
      escapableAssetHashes.length > 0

    let positionValues: PositionValue | undefined
    if (
      !hideAllAssets &&
      context.tradingMode === 'perpetual' &&
      userAssets.length > 0
    ) {
      const firstAsset = userAssets[0]
      if (firstAsset !== undefined) {
        positionValues = await this.getPositionValue(
          firstAsset.positionOrVaultId,
          context
        )
      }
    }

    const assetEntries = userAssets.map((a) =>
      toUserAssetEntry(
        a,
        context.tradingMode,
        escapableMap,
        context.freezeStatus,
        assetPrices,
        positionValues,
        collateralAsset?.assetId,
        assetDetailsMap
      )
    )

    const balanceChangesEntries = history.map((h) =>
      toUserBalanceChangeEntries(h, assetDetailsMap)
    )
    const transactions = buildUserTransactions(
      sentTransactions,
      userTransactions,
      collateralAsset,
      assetDetailsMap
    )

    const totalTransactions = userTransactionsCount
    const offers =
      await this.forcedTradeOfferViewService.toEntriesWithFullHistory(
        forcedTradeOffers,
        starkKey
      )

    const totalL2Transactions =
      sumUpTransactionCount(
        preprocessedUserL2TransactionsStatistics?.cumulativeL2TransactionsStatistics,
        this.excludeL2TransactionTypes
      ) +
      sumUpTransactionCount(
        liveL2TransactionStatistics,
        this.excludeL2TransactionTypes
      )

    // This is a workaround to show the collateral asset row
    // at the top of the assets table when the exchange is frozen
    // and user has other perpetual assets but no collateral asset.
    // This is because that's where we show the 'Escape' button.
    if (
      context.tradingMode === 'perpetual' &&
      context.freezeStatus === 'frozen' &&
      collateralAsset !== undefined &&
      !hideAllAssets &&
      assetEntries.length > 0
    ) {
      // As per logic before, collateral asset is always the first one
      const topAsset = assetEntries[0]
      if (topAsset && topAsset.asset.hashOrId !== collateralAsset.assetId) {
        assetEntries.unshift({
          asset: {
            hashOrId: collateralAsset.assetId,
          },
          balance: 0n,
          value: 0n,
          vaultOrPositionId: topAsset.vaultOrPositionId,
          fundingPayment: undefined,
          action: 'ESCAPE',
        })
      }
    }

    const content = renderUserPage({
      context,
      starkKey,
      ethereumAddress: registeredUser?.ethAddress,
      l2Transactions: l2Transactions.map(l2TransactionToEntry),
      totalL2Transactions,
      escapableAssets: toEscapableBalanceEntries(
        escapableMap,
        context,
        assetDetailsMap,
        collateralAsset
      ),
      withdrawableAssets: withdrawableAssets.map((asset) =>
        toWithdrawableAssetEntry(
          asset,
          context,
          assetDetailsMap,
          collateralAsset
        )
      ),
      exchangeAddress: this.exchangeAddress,
      finalizableOffers: finalizableOffers.map((offer) =>
        this.forcedTradeOfferViewService.toFinalizableOfferEntry(offer)
      ),
      assets: hideAllAssets ? [] : assetEntries, // When frozen and escaped, don't show assets
      positionValue: positionValues?.positionValue
        ? positionValues.positionValue / 10000n
        : undefined,
      totalAssets: hideAllAssets ? 0 : userStatistics?.assetCount ?? 0,
      balanceChanges: balanceChangesEntries,
      totalBalanceChanges: userStatistics?.balanceChangeCount ?? 0,
      transactions,
      totalTransactions,
      offers,
      totalOffers: forcedTradeOffersCount,
      performUserActions,
    })

    return { type: 'success', content }
  }

  async getPositionValue(positionOrVaultId: bigint, context: PageContext) {
    if (context.tradingMode !== 'perpetual') {
      return { fundingPayments: {}, positionValue: undefined }
    }

    const merkleProof = await this.stateUpdater.generateMerkleProof(
      positionOrVaultId
    )

    const latestStateUpdate = await this.stateUpdateRepository.findLast()
    if (!latestStateUpdate) {
      throw new Error('No state update found')
    }
    if (!latestStateUpdate.perpetualState) {
      throw new Error('No perpetual state found')
    }

    if (!(merkleProof.leaf instanceof PositionLeaf)) {
      throw new Error('Merkle proof is not for a position')
    }
    return calculatePositionValue(
      merkleProof as MerkleProof<PositionLeaf>,
      latestStateUpdate.perpetualState
    )
  }

  async getUserAssetsPage(
    givenUser: Partial<UserDetails>,
    starkKey: StarkKey,
    pagination: PaginationOptions
  ): Promise<ControllerResult> {
    const context = await this.pageContextService.getPageContext(givenUser)
    const collateralAsset = this.pageContextService.getCollateralAsset(context)
    const [registeredUser, userAssets, assetPrices, userStatistics] =
      await Promise.all([
        this.userRegistrationEventRepository.findByStarkKey(starkKey),
        this.preprocessedAssetHistoryRepository.getCurrentByStarkKeyPaginated(
          starkKey,
          pagination,
          collateralAsset?.assetId
        ),
        this.pricesRepository.getAllLatest(),
        this.preprocessedUserStatisticsRepository.findCurrentByStarkKey(
          starkKey
        ),
      ])

    if (!userStatistics) {
      return {
        type: 'not found',
        message: `User with starkKey ${starkKey.toString()} not found`,
      }
    }

    const escapableMap = await getEscapableAssets(
      this.userTransactionRepository,
      this.sentTransactionRepository,
      this.vaultRepository,
      context,
      starkKey,
      collateralAsset
    )

    const escapableAssetHashes: AssetHash[] = [
      ...Object.values(escapableMap).map((a) => a.assetHash),
    ]

    const assetDetailsMap = await this.assetDetailsService.getAssetDetailsMap({
      userAssets: userAssets,
      escapableAssetHashes,
    })

    const hideAllAssets =
      context.freezeStatus === 'frozen' &&
      context.tradingMode === 'perpetual' &&
      escapableAssetHashes.length > 0

    let postionValues: PositionValue | undefined
    if (
      !hideAllAssets &&
      context.tradingMode === 'perpetual' &&
      userAssets.length > 0
    ) {
      const firstAsset = userAssets[0]
      if (firstAsset !== undefined) {
        postionValues = await this.getPositionValue(
          firstAsset.positionOrVaultId,
          context
        )
      }
    }

    const assets = userAssets.map((a) =>
      toUserAssetEntry(
        a,
        context.tradingMode,
        escapableMap,
        context.freezeStatus,
        assetPrices,
        postionValues,
        collateralAsset?.assetId,
        assetDetailsMap
      )
    )

    const content = renderUserAssetsPage({
      context,
      starkKey,
      ethereumAddress: registeredUser?.ethAddress,
      assets: hideAllAssets ? [] : assets, // When frozen and escaped, don't show assets
      ...pagination,
      total: hideAllAssets ? 0 : userStatistics.assetCount,
    })
    return { type: 'success', content }
  }

  async getUserL2TransactionsPage(
    givenUser: Partial<UserDetails>,
    starkKey: StarkKey,
    pagination: PaginationOptions
  ): Promise<ControllerResult> {
    const context = await this.pageContextService.getPageContext(givenUser)
    const [
      l2Transactions,
      preprocessedUserL2TransactionsStatistics,
      liveL2TransactionStatistics,
    ] = await Promise.all([
      this.l2TransactionRepository.getUserSpecificPaginated(
        starkKey,
        pagination,
        this.excludeL2TransactionTypes
      ),
      this.preprocessedUserL2TransactionsStatisticsRepository.findLatestByStarkKey(
        starkKey
      ),
      this.l2TransactionRepository.getLiveStatisticsByStarkKey(starkKey),
    ])

    const totalL2Transactions =
      sumUpTransactionCount(
        preprocessedUserL2TransactionsStatistics?.cumulativeL2TransactionsStatistics,
        this.excludeL2TransactionTypes
      ) +
      sumUpTransactionCount(
        liveL2TransactionStatistics,
        this.excludeL2TransactionTypes
      )

    const content = renderUserL2TransactionsPage({
      context,
      starkKey,
      l2Transactions: l2Transactions.map(l2TransactionToEntry),
      total: totalL2Transactions,
      ...pagination,
    })
    return { type: 'success', content }
  }

  async getUserBalanceChangesPage(
    givenUser: Partial<UserDetails>,
    starkKey: StarkKey,
    pagination: PaginationOptions
  ): Promise<ControllerResult> {
    const [context, history, userStatistics] = await Promise.all([
      this.pageContextService.getPageContext(givenUser),
      this.preprocessedAssetHistoryRepository.getByStarkKeyPaginated(
        starkKey,
        pagination
      ),
      this.preprocessedUserStatisticsRepository.findCurrentByStarkKey(starkKey),
    ])

    if (!userStatistics) {
      return {
        type: 'not found',
        message: `User with starkKey ${starkKey.toString()} not found`,
      }
    }

    const assetDetailsMap = await this.assetDetailsService.getAssetDetailsMap({
      assetHistory: history,
    })

    const balanceChanges = history.map((h) =>
      toUserBalanceChangeEntries(h, assetDetailsMap)
    )

    const content = renderUserBalanceChangesPage({
      context,
      starkKey,
      balanceChanges,
      ...pagination,
      total: userStatistics.balanceChangeCount,
    })

    return { type: 'success', content }
  }

  async getUserTransactionsPage(
    givenUser: Partial<UserDetails>,
    starkKey: StarkKey,
    pagination: PaginationOptions
  ): Promise<ControllerResult> {
    const context = await this.pageContextService.getPageContext(givenUser)
    const collateralAsset = this.pageContextService.getCollateralAsset(context)
    const [sentTransactions, userTransactions, userTransactionsCount] =
      await Promise.all([
        this.sentTransactionRepository.getByStarkKey(starkKey),
        this.userTransactionRepository.getByStarkKey(
          starkKey,
          undefined,
          pagination
        ),
        this.userTransactionRepository.getCountByStarkKey(starkKey),
      ])

    const assetDetailsMap = await this.assetDetailsService.getAssetDetailsMap({
      sentTransactions,
      userTransactions,
    })

    const transactions = buildUserTransactions(
      pagination.offset === 0 ? sentTransactions : [], // display sent transactions only on the first page
      userTransactions,
      collateralAsset,
      assetDetailsMap
    )
    const totalTransactions =
      userTransactionsCount +
      sentTransactions.filter((t) => t.mined !== undefined && !t.mined.reverted)
        .length

    const content = renderUserTransactionsPage({
      context,
      starkKey,
      transactions,
      ...pagination,
      total: totalTransactions,
    })

    return { type: 'success', content }
  }

  async getUserOffersPage(
    givenUser: Partial<UserDetails>,
    starkKey: StarkKey,
    pagination: PaginationOptions
  ): Promise<ControllerResult> {
    const [context, forcedTradeOffers, forcedTradeOffersCount] =
      await Promise.all([
        this.pageContextService.getPageContext(givenUser),
        this.forcedTradeOfferRepository.getByMakerOrTakerStarkKey(
          starkKey,
          pagination
        ),
        this.forcedTradeOfferRepository.countByMakerOrTakerStarkKey(starkKey),
      ])
    if (context.tradingMode !== 'perpetual') {
      return { type: 'not found' }
    }

    const offers =
      await this.forcedTradeOfferViewService.toEntriesWithFullHistory(
        forcedTradeOffers,
        starkKey
      )

    const content = renderUserOffersPage({
      context,
      starkKey,
      offers,
      ...pagination,
      total: forcedTradeOffersCount,
    })
    return { type: 'success', content }
  }
}

function toUserAssetEntry(
  asset: PreprocessedAssetHistoryRecord,
  tradingMode: TradingMode,
  escapableMap: EscapableMap,
  freezeStatus: FreezeStatus,
  assetPrices: PricesRecord[],
  positionValues: PositionValue | undefined,
  collateralAssetId?: AssetId,
  assetDetailsMap?: AssetDetailsMap
): UserAssetEntry {
  const escapableEntry = escapableMap[asset.positionOrVaultId.toString()]
  let action: UserAssetEntry['action'] = 'NO_ACTION'

  if (tradingMode === 'spot' || asset.assetHashOrId === collateralAssetId) {
    if (freezeStatus !== 'frozen') {
      action = 'WITHDRAW'
    } else {
      action = escapableEntry === undefined ? 'ESCAPE' : 'NO_ACTION'
    }
  } else {
    if (freezeStatus !== 'frozen') {
      action = 'CLOSE'
    } else {
      action = 'USE_COLLATERAL_ESCAPE'
    }
  }

  // Price from preprocessedAssetHistory is a price from the moment when the position was opened.
  // We need to use the latest price for the asset from PricesRepository.
  const assetPrice = assetPrices.find((p) => p.assetId === asset.assetHashOrId)

  const positionValue =
    positionValues?.fundingPayments[asset.assetHashOrId.toString()]
  return {
    asset: {
      hashOrId: asset.assetHashOrId,
      details: AssetHash.check(asset.assetHashOrId)
        ? assetDetailsMap?.getByAssetHash(asset.assetHashOrId)
        : undefined,
    },
    balance: asset.balance,
    value:
      asset.assetHashOrId === collateralAssetId
        ? asset.balance / 10000n // TODO: use the correct decimals
        : assetPrice !== undefined
        ? getAssetValueUSDCents(asset.balance, assetPrice.price)
        : undefined,
    fundingPayment:
      positionValue !== undefined ? positionValue / 10000n : undefined,
    vaultOrPositionId: asset.positionOrVaultId.toString(),
    action,
  }
}

function toUserBalanceChangeEntries(
  record: PreprocessedAssetHistoryRecord,
  assetDetailsMap?: AssetDetailsMap
): UserBalanceChangeEntry {
  return {
    timestamp: record.timestamp,
    stateUpdateId: record.stateUpdateId.toString(),
    asset: {
      hashOrId: record.assetHashOrId,
      details: AssetHash.check(record.assetHashOrId)
        ? assetDetailsMap?.getByAssetHash(record.assetHashOrId)
        : undefined,
    },
    balance: record.balance,
    change: record.balance - record.prevBalance,
    vaultOrPositionId: record.positionOrVaultId.toString(),
  }
}

function buildUserTransactions(
  sentTransactions: SentTransactionRecord[],
  userTransactions: UserTransactionRecord[],
  collateralAsset?: CollateralAsset,
  assetDetailsMap?: AssetDetailsMap
): TransactionEntry[] {
  const userTransactionHashes = userTransactions.map((t) => t.transactionHash)
  const sentEntries = sentTransactions
    .filter((t) => !userTransactionHashes.includes(t.transactionHash))
    .map((t) => sentTransactionToEntry(t, collateralAsset, assetDetailsMap))

  const userEntries = userTransactions.map((t) =>
    userTransactionToEntry(t, collateralAsset, assetDetailsMap)
  )

  return [...sentEntries, ...userEntries]
}

function toWithdrawableAssetEntry(
  asset: {
    assetHash: AssetHash
    withdrawableBalance: bigint
  },
  context: PageContext,
  assetDetailsMap?: AssetDetailsMap,
  collateralAsset?: CollateralAsset
): WithdrawableAssetEntry {
  return {
    asset: {
      hashOrId:
        collateralAsset?.assetHash === asset.assetHash
          ? collateralAsset.assetId
          : asset.assetHash,
      details:
        context.tradingMode === 'perpetual'
          ? getCollateralAssetDetails(context.collateralAsset)
          : assetDetailsMap?.getByAssetHash(asset.assetHash),
    },
    amount: asset.withdrawableBalance,
  }
}

function toEscapableBalanceEntries(
  escapableMap: EscapableMap,
  context: PageContext,
  assetDetailsMap?: AssetDetailsMap,
  collateralAsset?: CollateralAsset
): EscapableAssetEntry[] {
  return Object.entries(escapableMap)
    .filter(([_, value]) => value.amount > 0)
    .map(([positionOrVaultIdStr, value]) => ({
      asset: {
        hashOrId:
          collateralAsset?.assetHash === value.assetHash
            ? collateralAsset.assetId
            : value.assetHash,
        details:
          context.tradingMode === 'perpetual'
            ? getCollateralAssetDetails(context.collateralAsset)
            : assetDetailsMap?.getByAssetHash(value.assetHash),
      },
      amount: value.amount,
      positionOrVaultId: BigInt(positionOrVaultIdStr),
    }))
}
