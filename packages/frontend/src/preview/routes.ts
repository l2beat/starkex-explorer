/* eslint-disable import/no-extraneous-dependencies */
import { PageContext, PageContextWithUser, UserDetails } from '@explorer/shared'
import {
  AssetHash,
  AssetId,
  EthereumAddress,
  Hash256,
  PedersenHash,
  StarkKey,
  Timestamp,
} from '@explorer/types'
import Router from '@koa/router'
import { randomInt } from 'crypto'
import Koa from 'koa'

import {
  renderErrorPage,
  renderFinalizeEscapeDetailsPage,
  renderFreezeRequestDetailsPage,
  renderHomeAvailableOffersPage,
  renderHomeL2TransactionsPage,
  renderHomePage,
  renderHomeStateUpdatesPage,
  renderHomeTransactionsPage,
  renderMerkleProofPage,
  renderNewPerpetualForcedActionPage,
  renderNewSpotForcedWithdrawPage,
  renderOfferAndForcedTradePage,
  renderPerpetualForcedWithdrawalPage,
  renderRawL2TransactionPage,
  renderRegularWithdrawalPage,
  renderSpotForcedWithdrawalPage,
  renderStateUpdateBalanceChangesPage,
  renderStateUpdatePage,
  renderStateUpdateTransactionsPage,
  renderTutorialPage,
  renderUserAssetsPage,
  renderUserBalanceChangesPage,
  renderUserOffersPage,
  renderUserPage,
  renderUserRecoverPage,
  renderUserRegisterPage,
  renderUserTransactionsPage,
} from '../view'
import { renderDevPage } from '../view/pages/DevPage'
import { renderEscapeHatchActionPage } from '../view/pages/forced-actions/EscapeHatchActionPage'
import { renderFreezeRequestActionPage } from '../view/pages/forced-actions/FreezeRequestActionPage'
import { renderPerpetualL2TransactionDetailsPage } from '../view/pages/l2-transaction/PerpetualL2TransactionDetailsPage'
import { renderStateUpdateL2TransactionsPage } from '../view/pages/state-update/StateUpdateL2TransactionsPage'
import { renderInitializeEscapePage } from '../view/pages/transaction/InitializeEscapePage'
import { renderTutorialsPage } from '../view/pages/tutorial/TutorialsPage'
import { renderUserL2TransactionsPage } from '../view/pages/user/UserL2TransactionsPage'
import { amountBucket, assetBucket } from './data/buckets'
import { fakeCollateralAsset } from './data/collateralAsset'
import {
  randomHomeForcedTransactionEntry,
  randomHomeOfferEntry,
  randomHomeStateUpdateEntry,
} from './data/home'
import {
  perpetualL2TransactionsBucket,
  randomAggregatedPerpetualL2TransactionEntry,
  randomPerpetualL2ConditionalTransferTransaction,
  randomPerpetualL2DeleverageTransaction,
  randomPerpetualL2DepositTransaction,
  randomPerpetualL2ForcedTradeTransaction,
  randomPerpetualL2ForcedWithdrawalTransaction,
  randomPerpetualL2FundingTickTransaction,
  randomPerpetualL2LiquidateTransaction,
  randomPerpetualL2MultiTransaction,
  randomPerpetualL2OraclePricesTickTransaction,
  randomPerpetualL2TradeTransaction,
  randomPerpetualL2TransactionEntry,
  randomPerpetualL2TransferTransaction,
  randomPerpetualL2WithdrawalToAddressTransaction,
  randomPerpetualUserL2TransactionEntry,
} from './data/l2Transactions'
import {
  randomStateUpdateBalanceChangeEntry,
  randomStateUpdatePriceEntry,
  randomStateUpdateTransactionEntry,
} from './data/stateUpdate'
import {
  randomOfferDetails,
  randomParty,
  randomRecipient,
  userParty,
} from './data/transactions'
import { tutorial, tutorials } from './data/tutorial'
import {
  randomEscapableEntry,
  randomUserAssetEntry,
  randomUserBalanceChangeEntry,
  randomUserOfferEntry,
  randomUserTransactionEntry,
  randomWithdrawableAssetEntry,
} from './data/user'
import { randomId, randomTimestamp, repeat } from './data/utils'

export const router = new Router()

interface Route {
  path: string
  link?: string
  description: string
  breakAfter?: boolean // add bottom margin when displaying this route
  isTransactionPage?: boolean
  isOfferPage?: boolean
  render: (ctx: Koa.ParameterizedContext) => void
}

const routes: Route[] = [
  // #region Home
  {
    path: '/',
    description: 'A listing of all dev routes.',
    render: (ctx) => {
      ctx.body = renderDevPage({
        routes: routes.map((x) => ({
          path: x.link ?? x.path,
          description: x.description,
          breakAfter: x.breakAfter,
        })),
      })
    },
  },
  {
    path: '/home',
    description: 'The home page.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)

      ctx.body = renderHomePage({
        context,
        tutorials,
        stateUpdates: repeat(10, randomHomeStateUpdateEntry),
        forcedTransactions: repeat(4, randomHomeForcedTransactionEntry),
        l2Transactions: [],
        statistics: {
          stateUpdateCount: 6315,
          l2TransactionCount: 3255123,
          forcedTransactionCount: 68,
          offerCount: 6,
        },
        offers: repeat(3, randomHomeOfferEntry),
      })
    },
  },
  {
    path: '/home/with-l2-transactions',
    description:
      'The home page for project that shared feeder gateway with us.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx, {
        showL2Transactions: true,
      })

      ctx.body = renderHomePage({
        context,
        tutorials,
        stateUpdates: repeat(22, randomHomeStateUpdateEntry),
        l2Transactions: repeat(8, randomPerpetualL2TransactionEntry),
        forcedTransactions: repeat(4, randomHomeForcedTransactionEntry),
        statistics: {
          stateUpdateCount: 6315,
          l2TransactionCount: 3255123,
          forcedTransactionCount: 68,
          offerCount: 6,
        },
        offers: repeat(4, randomHomeOfferEntry),
      })
    },
  },
  {
    path: '/home/no-tutorials',
    description: 'The home page, but without any tutorials.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderHomePage({
        context,
        tutorials: [],
        stateUpdates: repeat(10, randomHomeStateUpdateEntry),
        forcedTransactions: repeat(4, randomHomeForcedTransactionEntry),
        l2Transactions: [],
        statistics: {
          stateUpdateCount: 6315,
          l2TransactionCount: 3255123,
          forcedTransactionCount: 68,
          offerCount: 6,
        },
        offers: repeat(3, randomHomeOfferEntry),
      })
    },
  },
  {
    path: '/l2-transactions',
    link: '/l2-transactions',
    description: 'L2 transaction list. Supports pagination.',
    render: (ctx) => {
      const total = 5123
      const { limit, offset, visible } = getPagination(ctx, total)

      ctx.body = renderHomeL2TransactionsPage({
        context: getPerpetualPageContext(ctx, { showL2Transactions: true }),
        l2Transactions: repeat(visible, randomPerpetualL2TransactionEntry),
        total: total,
        limit: limit,
        offset: offset,
      })
    },
  },
  {
    path: '/state-updates',
    description:
      'State update list accessible from home page. Supports pagination.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      const total = 5123
      const { limit, offset, visible } = getPagination(ctx, total)
      ctx.body = renderHomeStateUpdatesPage({
        context,
        stateUpdates: repeat(visible, randomHomeStateUpdateEntry),
        limit,
        offset,
        total,
      })
    },
  },
  {
    path: '/forced-transactions',
    description:
      'Forced transaction list accessible from home page. Supports pagination.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      const total = 68
      const { limit, offset, visible } = getPagination(ctx, total)
      ctx.body = renderHomeTransactionsPage({
        context,
        forcedTransactions: repeat(visible, randomHomeForcedTransactionEntry),
        limit,
        offset,
        total,
      })
    },
  },
  {
    path: '/offers',
    description:
      'Available offer list accessible from home page. Supports pagination.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      const total = 68
      const { limit, offset, visible } = getPagination(ctx, total)
      ctx.body = renderHomeAvailableOffersPage({
        context,
        offers: repeat(visible, randomHomeOfferEntry),
        limit,
        offset,
        total,
      })
    },
  },
  {
    path: '/proof/:positionOrVaultId',
    link: '/proof/xyz',
    description:
      'Merkle proof for a vault or position id made from the latest state update',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderMerkleProofPage({
        context,
        positionOrVaultId: BigInt(randomId()),
        merkleProof: {
          rootHash: PedersenHash.fake(),
          path: repeat(9, () => ({
            left: PedersenHash.fake(),
            right: PedersenHash.fake(),
          })),
          leaf: JSON.stringify({
            starkKey: StarkKey.fake(),
            balance: 123456789,
            token: AssetHash.fake(),
          }),
        },
      })
    },
    breakAfter: true,
  },
  // #endregion
  // #region State update
  {
    path: '/state-updates/:id',
    link: '/state-updates/xyz',
    description: 'State update page.',
    render: (ctx) => {
      const ethereumTimestamp = randomTimestamp()
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderStateUpdatePage({
        context,
        id: randomId(),
        blockNumber: randomInt(11906388, 20968939),
        stateTransitionHash: Hash256.fake(),
        balancesTreeRootHash: PedersenHash.fake(),
        ethereumTimestamp,
        starkExTimestamp: Timestamp(
          Math.floor(
            Number(ethereumTimestamp) - Math.random() * 12 * 60 * 60 * 1000
          )
        ),
        l2Transactions: [],
        totalL2Transactions: 0,
        balanceChanges: repeat(10, randomStateUpdateBalanceChangeEntry),
        totalBalanceChanges: 1200,
        priceChanges: repeat(15, randomStateUpdatePriceEntry),
        transactions: repeat(10, randomStateUpdateTransactionEntry),
        totalTransactions: 123,
      })
    },
  },
  {
    path: '/state-updates/:id/with-l2-transactions',
    link: '/state-updates/xyz/with-l2-transactions',
    description: 'State update page with l2 transacitons.',
    render: (ctx) => {
      const ethereumTimestamp = randomTimestamp()
      const context = getPerpetualPageContext(ctx, {
        showL2Transactions: true,
      })
      ctx.body = renderStateUpdatePage({
        context,
        id: randomId(),
        blockNumber: randomInt(11906388, 20968939),
        stateTransitionHash: Hash256.fake(),
        balancesTreeRootHash: PedersenHash.fake(),
        ethereumTimestamp,
        starkExTimestamp: Timestamp(
          Math.floor(
            Number(ethereumTimestamp) - Math.random() * 12 * 60 * 60 * 1000
          )
        ),
        balanceChanges: repeat(10, randomStateUpdateBalanceChangeEntry),
        totalBalanceChanges: 1000,
        priceChanges: repeat(15, randomStateUpdatePriceEntry),
        l2Transactions: repeat(10, randomPerpetualL2TransactionEntry),
        totalL2Transactions: 150000,
        transactions: repeat(10, randomStateUpdateTransactionEntry),
        totalTransactions: 150,
      })
    },
  },
  {
    path: '/state-updates/:id/l2-transactions',
    link: '/state-updates/xyz/l2-transactions',
    description:
      'L2 transactions list included in specific state update. Supports pagination.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      const total = 231
      const { limit, offset, visible } = getPagination(ctx, total)
      ctx.body = renderStateUpdateL2TransactionsPage({
        context,
        id: '1534',
        l2Transactions: repeat(visible, randomPerpetualL2TransactionEntry),
        total: total,
        limit: limit,
        offset: offset,
      })
    },
  },
  {
    path: '/state-updates/:id/balance-changes',
    link: '/state-updates/xyz/balance-changes',
    description:
      'Balance change list accessible from state update page. Supports pagination.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      const total = 231
      const { limit, offset, visible } = getPagination(ctx, total)
      ctx.body = renderStateUpdateBalanceChangesPage({
        context,
        id: '1534',
        balanceChanges: repeat(visible, randomStateUpdateBalanceChangeEntry),
        limit,
        offset,
        total,
      })
    },
  },
  {
    path: '/state-updates/:id/transactions',
    link: '/state-updates/xyz/transactions',
    description:
      'Forced transaction list accessible from state update page. Supports pagination.',
    breakAfter: true,
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      const total = 231
      const { limit, offset, visible } = getPagination(ctx, total)
      ctx.body = renderStateUpdateTransactionsPage({
        context,
        id: '1534',
        transactions: repeat(visible, randomStateUpdateTransactionEntry),
        limit,
        offset,
        total,
      })
    },
  },
  // #endregion
  // #region User
  {
    path: '/users/recover',
    description: 'Stark key recovery page, the stark key is not known.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx, {
        fallbackToFakeUser: true,
      })
      ctx.body = renderUserRecoverPage({
        context,
      })
    },
  },
  {
    path: '/users/register',
    description:
      'Stark key register page, the stark key is known but not registered.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx, {
        fallbackToFakeUser: true,
      })

      ctx.body = renderUserRegisterPage({
        context: {
          ...context,
          user: {
            ...context.user,
            starkKey: context.user.starkKey ?? StarkKey.fake(),
          },
        },
        exchangeAddress: EthereumAddress.fake(),
      })
    },
  },
  {
    path: '/users/me/unregistered',
    description:
      'My user page, the stark key is known, but it’s not registered.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx, {
        fallbackToFakeUser: true,
      })
      const starkKey = context.user.starkKey ?? StarkKey.fake()

      ctx.body = renderUserPage({
        context: {
          ...context,
          user: {
            ...context.user,
            starkKey,
          },
        },
        starkKey: starkKey,
        exchangeAddress: EthereumAddress.fake(),
        withdrawableAssets: repeat(3, randomWithdrawableAssetEntry),
        finalizableOffers: [],
        assets: repeat(7, randomUserAssetEntry),
        totalAssets: 18,
        balanceChanges: repeat(10, randomUserBalanceChangeEntry),
        totalBalanceChanges: 6999,
        transactions: repeat(10, randomUserTransactionEntry),
        totalTransactions: 48,
        l2Transactions: [],
        totalL2Transactions: 1643000,
        offers: repeat(6, () => randomUserOfferEntry(true)),
        totalOffers: 6,
        escapableAssets: [],
      })
    },
  },
  {
    path: '/users/me/registered',
    description: 'My user page, the stark key is known and registered.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx, {
        fallbackToFakeUser: true,
      })
      const starkKey = context.user.starkKey ?? StarkKey.fake()

      ctx.body = renderUserPage({
        context: {
          ...context,
          user: {
            ...context.user,
            starkKey,
          },
        },
        starkKey: starkKey,
        ethereumAddress: context.user.address,
        exchangeAddress: EthereumAddress.fake(),
        withdrawableAssets: repeat(3, randomWithdrawableAssetEntry),
        finalizableOffers: repeat(2, randomUserOfferEntry),
        assets: repeat(7, randomUserAssetEntry),
        totalAssets: 18,
        balanceChanges: repeat(10, randomUserBalanceChangeEntry),
        totalBalanceChanges: 6999,
        transactions: repeat(10, randomUserTransactionEntry),
        totalTransactions: 48,
        l2Transactions: [],
        totalL2Transactions: 3643000,
        offers: repeat(6, () => randomUserOfferEntry(true)),
        totalOffers: 7,
        escapableAssets: [],
      })
    },
    breakAfter: true,
  },
  {
    path: '/users/:starkKey',
    link: '/users/someone',
    description: 'Someone else’s user page.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)

      ctx.body = renderUserPage({
        context,
        starkKey: StarkKey.fake(),
        ethereumAddress: EthereumAddress.fake(),
        exchangeAddress: EthereumAddress.fake(),
        withdrawableAssets: repeat(3, randomWithdrawableAssetEntry),
        finalizableOffers: repeat(2, randomUserOfferEntry),
        assets: repeat(7, randomUserAssetEntry),
        totalAssets: 18,
        balanceChanges: repeat(10, randomUserBalanceChangeEntry),
        totalBalanceChanges: 123000,
        transactions: repeat(10, randomUserTransactionEntry),
        totalTransactions: 23,
        l2Transactions: [],
        totalL2Transactions: 0,
        offers: repeat(6, () => randomUserOfferEntry(true)),
        totalOffers: 12,
        escapableAssets: [],
      })
    },
  },
  {
    path: '/users/:starkKey/with-l2-transactions',
    link: '/users/someone/with-l2-transactions',
    description:
      'Someone else’s user page for project that feeder gateway with us.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx, {
        showL2Transactions: true,
      })

      ctx.body = renderUserPage({
        context,
        starkKey: StarkKey.fake(),
        ethereumAddress: EthereumAddress.fake(),
        exchangeAddress: EthereumAddress.fake(),
        withdrawableAssets: repeat(3, randomWithdrawableAssetEntry),
        finalizableOffers: repeat(2, randomUserOfferEntry),
        assets: repeat(7, randomUserAssetEntry),
        totalAssets: 18,
        balanceChanges: repeat(10, randomUserBalanceChangeEntry),
        totalBalanceChanges: 123000,
        transactions: repeat(10, randomUserTransactionEntry),
        totalTransactions: 99,
        l2Transactions: repeat(6, randomPerpetualUserL2TransactionEntry),
        totalL2Transactions: 123000000,
        offers: repeat(6, () => randomUserOfferEntry(true)),
        totalOffers: 12,
        escapableAssets: [],
      })
    },
  },
  // #endregion
  // #region User lists
  {
    path: '/users/:starkKey/assets',
    link: '/users/someone/assets',
    description:
      'Assets list accessible from someone else’s user page. Supports pagination.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      const total = 7
      const { limit, offset, visible } = getPagination(ctx, total)
      ctx.body = renderUserAssetsPage({
        context,
        starkKey: StarkKey.fake(),
        ethereumAddress: undefined,
        assets: repeat(visible, randomUserAssetEntry),
        limit,
        offset,
        total,
      })
    },
  },
  {
    path: '/users/:starkKey/l2-transactions',
    link: '/users/someone/l2-transactions',
    description:
      'L2 transaction list accessible from someone else’s user page. Supports pagination.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      const total = 5123
      const { limit, offset, visible } = getPagination(ctx, total)
      ctx.body = renderUserL2TransactionsPage({
        context,
        starkKey: StarkKey.fake(),
        l2Transactions: repeat(visible, randomPerpetualUserL2TransactionEntry),
        limit,
        offset,
        total,
      })
    },
  },
  {
    path: '/users/:starkKey/balance-changes',
    link: '/users/someone/balance-changes',
    description:
      'Balance change list accessible from user page. Supports pagination.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      const total = 3367
      const { limit, offset, visible } = getPagination(ctx, total)
      ctx.body = renderUserBalanceChangesPage({
        context,
        starkKey: StarkKey.fake(),
        balanceChanges: repeat(visible, randomUserBalanceChangeEntry),
        limit,
        offset,
        total,
      })
    },
  },
  {
    path: '/users/:starkKey/transactions',
    link: '/users/someone/transactions',
    description:
      'Ethereum transaction list accessible from user page. Supports pagination.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      const total = 48
      const { limit, offset, visible } = getPagination(ctx, total)
      ctx.body = renderUserTransactionsPage({
        context,
        starkKey: StarkKey.fake(),
        transactions: repeat(visible, randomUserTransactionEntry),
        limit,
        offset,
        total,
      })
    },
  },
  {
    path: '/users/:starkKey/offers',
    link: '/users/someone/offers',
    description: 'Offer list accessible from user page. Supports pagination.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      const total = 6
      const { limit, offset, visible } = getPagination(ctx, total)
      ctx.body = renderUserOffersPage({
        context,
        starkKey: StarkKey.fake(),
        offers: repeat(visible, () => randomUserOfferEntry(true)),
        limit,
        offset,
        total,
      })
    },
    breakAfter: true,
  },
  // #endregion
  // #region L2 transactions
  {
    path: '/l2-transactions/:id',
    link: '/l2-transactions/random',
    description: 'Perpetual L2 random transaction details page.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderPerpetualL2TransactionDetailsPage({
        context,
        transaction: randomAggregatedPerpetualL2TransactionEntry(),
      })
    },
  },
  {
    path: '/l2-transactions/perpetual/random/with-alternatives',
    link: '/l2-transactions/perpetual/random/with-alternatives',
    description:
      'Perpetual L2 random transaction details with alternatives details page.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderPerpetualL2TransactionDetailsPage({
        context,
        transaction: {
          ...randomAggregatedPerpetualL2TransactionEntry(),
          alternativeTransactions: repeat(randomInt(1, 10), () => ({
            timestamp: randomTimestamp(),
            ...perpetualL2TransactionsBucket.pick(),
          })),
        },
      })
    },
  },
  {
    path: '/l2-transactions/perpetual/random/as-alternative',
    link: '/l2-transactions/perpetual/random/as-alternative',
    description:
      'Perpetual L2 random transaction details as alternative details page.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderPerpetualL2TransactionDetailsPage({
        context,
        transaction: randomAggregatedPerpetualL2TransactionEntry(),
        altIndex: randomInt(1, 10),
      })
    },
  },
  {
    path: '/l2-transactions/perpetual/random/as-part-of-multi',
    link: '/l2-transactions/perpetual/random/as-part-of-multi',
    description:
      'Perpetual L2 random transaction details as part of multi details page.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderPerpetualL2TransactionDetailsPage({
        context,
        transaction: randomAggregatedPerpetualL2TransactionEntry(),
        multiIndex: randomInt(1, 10),
      })
    },
  },
  {
    path: '/l2-transactions/perpetual/random/as-alternative/as-part-of-multi',
    link: '/l2-transactions/perpetual/random/as-alternative/as-part-of-multi',
    description:
      'Perpetual L2 random transaction details as part of multi transaction that is alternative details page.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderPerpetualL2TransactionDetailsPage({
        context,
        transaction: randomAggregatedPerpetualL2TransactionEntry(),
        multiIndex: randomInt(1, 10),
        altIndex: randomInt(1, 10),
      })
    },
  },
  {
    path: '/l2-transactions/perpetual/deposit',
    link: '/l2-transactions/perpetual/deposit',
    description: 'Perpetual L2 deposit transaction details page.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderPerpetualL2TransactionDetailsPage({
        context,
        transaction: randomAggregatedPerpetualL2TransactionEntry(
          randomPerpetualL2DepositTransaction()
        ),
      })
    },
  },
  {
    path: '/l2-transactions/perpetual/forced-withdrawal',
    link: '/l2-transactions/perpetual/forced-withdrawal',
    description: 'Perpetual L2 forced withdrawal transaction details page.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderPerpetualL2TransactionDetailsPage({
        context,
        transaction: randomAggregatedPerpetualL2TransactionEntry(
          randomPerpetualL2ForcedWithdrawalTransaction()
        ),
      })
    },
  },
  {
    path: '/l2-transactions/perpetual/transfer',
    link: '/l2-transactions/perpetual/transfer',
    description: 'Perpetual L2 transfer transaction details page.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderPerpetualL2TransactionDetailsPage({
        context,
        transaction: randomAggregatedPerpetualL2TransactionEntry(
          randomPerpetualL2TransferTransaction()
        ),
      })
    },
  },
  {
    path: '/l2-transactions/perpetual/conditional-transfer',
    link: '/l2-transactions/perpetual/conditional-transfer',
    description: 'Perpetual L2 conditional transfer transaction details page.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderPerpetualL2TransactionDetailsPage({
        context,
        transaction: randomAggregatedPerpetualL2TransactionEntry(
          randomPerpetualL2ConditionalTransferTransaction()
        ),
      })
    },
  },
  {
    path: '/l2-transactions/perpetual/trade',
    link: '/l2-transactions/perpetual/trade',
    description: 'Perpetual L2 trade transaction details page.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderPerpetualL2TransactionDetailsPage({
        context,
        transaction: randomAggregatedPerpetualL2TransactionEntry(
          randomPerpetualL2TradeTransaction()
        ),
      })
    },
  },
  {
    path: '/l2-transactions/perpetual/forced-trade',
    link: '/l2-transactions/perpetual/forced-trade',
    description: 'Perpetual L2 forced trade transaction details page.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderPerpetualL2TransactionDetailsPage({
        context,
        transaction: randomAggregatedPerpetualL2TransactionEntry(
          randomPerpetualL2ForcedTradeTransaction()
        ),
      })
    },
  },
  {
    path: '/l2-transactions/perpetual/withdraw-to-address',
    link: '/l2-transactions/perpetual/withdraw-to-address',
    description: 'Perpetual L2 withdraw to address transaction details page.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderPerpetualL2TransactionDetailsPage({
        context,
        transaction: randomAggregatedPerpetualL2TransactionEntry(
          randomPerpetualL2WithdrawalToAddressTransaction()
        ),
      })
    },
  },
  {
    path: '/l2-transactions/perpetual/deleverage',
    link: '/l2-transactions/perpetual/deleverage',
    description: 'Perpetual L2 deleverage transaction details page.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderPerpetualL2TransactionDetailsPage({
        context,
        transaction: randomAggregatedPerpetualL2TransactionEntry(
          randomPerpetualL2DeleverageTransaction()
        ),
      })
    },
  },
  {
    path: '/l2-transactions/perpetual/liquidate',
    link: '/l2-transactions/perpetual/liquidate',
    description: 'Perpetual L2 liquidate transaction details page.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderPerpetualL2TransactionDetailsPage({
        context,
        transaction: randomAggregatedPerpetualL2TransactionEntry(
          randomPerpetualL2LiquidateTransaction()
        ),
      })
    },
  },
  {
    path: '/l2-transactions/perpetual/funding-tick',
    link: '/l2-transactions/perpetual/funding-tick',
    description: 'Perpetual L2 funding tick transaction details page.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderPerpetualL2TransactionDetailsPage({
        context,
        transaction: randomAggregatedPerpetualL2TransactionEntry(
          randomPerpetualL2FundingTickTransaction()
        ),
      })
    },
  },
  {
    path: '/l2-transactions/perpetual/oracle-prices-tick',
    link: '/l2-transactions/perpetual/oracle-prices-tick',
    description: 'Perpetual L2 oracle prices tick transaction details page.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderPerpetualL2TransactionDetailsPage({
        context,
        transaction: randomAggregatedPerpetualL2TransactionEntry(
          randomPerpetualL2OraclePricesTickTransaction()
        ),
      })
    },
  },
  {
    path: '/l2-transactions/perpetual/multi',
    link: '/l2-transactions/perpetual/multi',
    description: 'Perpetual L2 multi transaction details page.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderPerpetualL2TransactionDetailsPage({
        context,
        transaction: randomAggregatedPerpetualL2TransactionEntry(
          randomPerpetualL2MultiTransaction()
        ),
      })
    },
  },
  {
    path: '/l2-transactions/perpetual/multi/with-alternatives',
    link: '/l2-transactions/perpetual/multi/with-alternatives',
    description:
      'Perpetual L2 multi transaction with alternatives details page.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderPerpetualL2TransactionDetailsPage({
        context,
        transaction: {
          ...randomAggregatedPerpetualL2TransactionEntry(
            randomPerpetualL2MultiTransaction()
          ),
          alternativeTransactions: repeat(randomInt(1, 10), () => ({
            ...perpetualL2TransactionsBucket.pick(),
            timestamp: randomTimestamp(),
          })),
        },
      })
    },
  },
  {
    path: '/l2-transactions/perpetual/multi/as-alternative',
    link: '/l2-transactions/perpetual/multi/as-alternative',
    description: 'Perpetual L2 multi transaction as alternative details page.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderPerpetualL2TransactionDetailsPage({
        context,
        transaction: randomAggregatedPerpetualL2TransactionEntry(
          randomPerpetualL2MultiTransaction()
        ),
        altIndex: randomInt(0, 10),
      })
    },
  },
  {
    path: '/raw-l2-transactions/:transactionId',
    link: '/raw-l2-transactions/random',
    description: 'Raw L2 transaction details page.',
    render: (ctx) => {
      ctx.body = renderRawL2TransactionPage({
        context: getPerpetualPageContext(ctx),
        transaction: randomAggregatedPerpetualL2TransactionEntry(),
      })
    },
    breakAfter: true,
  },
  // #endregion
  // #region Forced actions
  {
    path: '/forced/new/spot/withdraw',
    description: 'Form to create a new spot forced withdrawal.',
    render: (ctx) => {
      const context = getSpotPageContext(ctx, {
        fallbackToFakeUser: true,
      })
      ctx.body = renderNewSpotForcedWithdrawPage({
        context,
        starkKey: StarkKey.fake(),
        starkExAddress: EthereumAddress.fake(),
        asset: {
          hashOrId: AssetHash.fake(),
          balance: amountBucket.pick(),
          priceUSDCents: 10000n,
        },
        positionOrVaultId: 1234n,
      })
    },
  },
  {
    path: '/forced/new/perpetual/withdraw',
    description: 'Form to create a new perpetual forced withdrawal.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx, {
        fallbackToFakeUser: true,
      })
      ctx.body = renderNewPerpetualForcedActionPage({
        context,
        starkKey: StarkKey.fake(),
        starkExAddress: EthereumAddress.fake(),
        asset: {
          hashOrId: AssetId('USDC-6'),
          balance: amountBucket.pick(),
          priceUSDCents: 10000n,
        },
        positionOrVaultId: 1234n,
      })
    },
  },
  {
    path: '/forced/new/perpetual/buy',
    description: 'Form to create a new perpetual forced buy.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx, {
        fallbackToFakeUser: true,
      })
      ctx.body = renderNewPerpetualForcedActionPage({
        context,
        starkKey: StarkKey.fake(),
        starkExAddress: EthereumAddress.fake(),
        asset: {
          hashOrId: AssetId('BTC-10'),
          balance: amountBucket.pick() * -1n,
          priceUSDCents: 10000n,
        },
        positionOrVaultId: 1234n,
      })
    },
  },
  {
    path: '/forced/new/perpetual/sell',
    description: 'Form to create a new perpetual forced sell.',
    breakAfter: true,
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx, {
        fallbackToFakeUser: true,
      })
      ctx.body = renderNewPerpetualForcedActionPage({
        context,
        starkKey: StarkKey.fake(),
        starkExAddress: EthereumAddress.fake(),
        asset: {
          hashOrId: AssetId('ETH-9'),
          balance: amountBucket.pick(),
          priceUSDCents: 10000n,
        },
        positionOrVaultId: 1234n,
      })
    },
  },
  // #endregion
  // #region Freeze and escape
  {
    path: '/home/freezable',
    description: 'The home page when exchange can be frozen',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      context.freezeStatus = 'freezable'

      ctx.body = renderHomePage({
        context,
        tutorials,
        stateUpdates: repeat(6, randomHomeStateUpdateEntry),
        forcedTransactions: repeat(6, randomHomeForcedTransactionEntry),
        l2Transactions: [],
        statistics: {
          stateUpdateCount: 6315,
          l2TransactionCount: 3255123,
          forcedTransactionCount: 68,
          offerCount: 6,
        },
        offers: repeat(6, randomHomeOfferEntry),
      })
    },
  },
  {
    path: '/freeze',
    description: 'Request to freeze the exchange.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx, {
        fallbackToFakeUser: true,
      })
      context.freezeStatus = 'freezable'
      ctx.body = renderFreezeRequestActionPage({
        context,
        transactionHash: Hash256.fake(),
        type: 'ForcedWithdrawal',
        starkExAddress: EthereumAddress.fake(),
        starkKey: StarkKey.fake(),
        positionId: 12345n,
        quantizedAmount: 1000000000000000n,
      })
    },
  },
  {
    path: '/home/frozen',
    description: 'The home page when exchange is frozen',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      context.freezeStatus = 'frozen'

      ctx.body = renderHomePage({
        context,
        stateUpdates: repeat(6, randomHomeStateUpdateEntry),
        forcedTransactions: repeat(6, randomHomeForcedTransactionEntry),
        tutorials,
        l2Transactions: [],
        statistics: {
          stateUpdateCount: 6315,
          l2TransactionCount: 3255123,
          forcedTransactionCount: 68,
          offerCount: 6,
        },
        offers: repeat(6, randomHomeOfferEntry),
      })
    },
  },
  {
    path: '/users/me/exchange-frozen',
    description: 'My user page with ESCAPE button, the exchange is frozen.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx, {
        fallbackToFakeUser: true,
      })
      context.freezeStatus = 'frozen'
      const starkKey = context.user.starkKey ?? StarkKey.fake()

      ctx.body = renderUserPage({
        context: {
          ...context,
          user: {
            ...context.user,
            starkKey,
          },
        },
        starkKey: starkKey,
        ethereumAddress: context.user.address,
        exchangeAddress: EthereumAddress.fake(),
        withdrawableAssets: [],
        finalizableOffers: [],
        assets: [
          randomUserAssetEntry('ESCAPE', { hashOrId: AssetId('USDC-6') }),
          ...repeat(7, () => randomUserAssetEntry('USE_COLLATERAL_ESCAPE')),
        ],
        totalAssets: 18,
        balanceChanges: repeat(10, randomUserBalanceChangeEntry),
        totalBalanceChanges: 6999,
        transactions: repeat(10, randomUserTransactionEntry),
        totalTransactions: 48,
        l2Transactions: [],
        totalL2Transactions: 0,
        offers: repeat(6, randomUserOfferEntry),
        totalOffers: 6,
        escapableAssets: [],
      })
    },
  },
  {
    path: '/escape/:positionOrVaultId',
    link: '/escape/12345',
    description:
      'Initiate withdrawal via Escape Hatch of position or vault 12345',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx, {
        fallbackToFakeUser: true,
      })
      context.freezeStatus = 'frozen'
      ctx.body = renderEscapeHatchActionPage({
        context,
        starkKey: StarkKey.fake(),
        tradingMode: 'perpetual',
        escapeVerifierAddress: EthereumAddress.fake(),
        positionOrVaultId: 12345n,
        serializedMerkleProof: [],
        assetCount: 0,
        serializedState: [],
      })
    },
  },
  {
    path: '/users/me/finalizable-escape',
    description: 'My user page, the stark key is known and registered.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx, {
        fallbackToFakeUser: true,
      })
      context.freezeStatus = 'frozen'
      const starkKey = context.user.starkKey ?? StarkKey.fake()

      ctx.body = renderUserPage({
        context: {
          ...context,
          user: {
            ...context.user,
            starkKey,
          },
        },
        starkKey: starkKey,
        ethereumAddress: context.user.address,
        exchangeAddress: EthereumAddress.fake(),
        withdrawableAssets: [],
        finalizableOffers: [],
        assets: [],
        totalAssets: 0,
        balanceChanges: repeat(10, randomUserBalanceChangeEntry),
        totalBalanceChanges: 6999,
        transactions: repeat(10, randomUserTransactionEntry),
        totalTransactions: 48,
        l2Transactions: [],
        totalL2Transactions: 0,
        offers: repeat(6, randomUserOfferEntry),
        totalOffers: 10,
        escapableAssets: [randomEscapableEntry()],
      })
    },
  },
  {
    path: '/transactions/freeze-request/sent',
    description: 'Transaction view of a sent freeze request transaction.',
    isTransactionPage: true,
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderFreezeRequestDetailsPage({
        context,
        transactionHash: Hash256.fake(),
        history: [{ timestamp: randomTimestamp(), status: 'SENT' }],
        ignored: {
          starkKey: StarkKey.fake(),
          ethereumAddress: EthereumAddress.fake(),
        },
      })
    },
  },
  {
    path: '/transactions/freeze-request/mined',
    description: 'Transaction view of a mined freeze request transaction.',
    isTransactionPage: true,
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderFreezeRequestDetailsPage({
        context,
        transactionHash: Hash256.fake(),
        history: [
          { timestamp: randomTimestamp(), status: 'MINED' },
          { timestamp: randomTimestamp(), status: 'SENT' },
        ],
        ignored: {
          starkKey: StarkKey.fake(),
          ethereumAddress: EthereumAddress.fake(),
        },
      })
    },
  },
  {
    path: '/transactions/freeze-request/reverted',
    description: 'Transaction view of a reverted freeze request transaction.',
    isTransactionPage: true,
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderFreezeRequestDetailsPage({
        context,
        transactionHash: Hash256.fake(),
        history: [
          { timestamp: randomTimestamp(), status: 'REVERTED' },
          { timestamp: randomTimestamp(), status: 'SENT' },
        ],
        ignored: {
          starkKey: StarkKey.fake(),
          ethereumAddress: EthereumAddress.fake(),
        },
      })
    },
  },
  {
    path: '/transactions/initialize-escape/sent',
    description: 'Transaction view of a sent initialize escape transaction.',
    isTransactionPage: true,
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderInitializeEscapePage({
        context,
        transactionHash: Hash256.fake(),
        recipient: randomRecipient(),
        positionOrVaultId: randomId(),
        history: [{ timestamp: randomTimestamp(), status: 'SENT' }],
        stateUpdateId: 1234,
      })
    },
  },
  {
    path: '/transactions/initialize-escape/mined',
    description: 'Transaction view of a mined initialize escape transaction.',
    isTransactionPage: true,
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderInitializeEscapePage({
        context,
        transactionHash: Hash256.fake(),
        recipient: randomRecipient(),
        dataFromL1: {
          asset: { hashOrId: AssetId('USDC-6') },
          amount: amountBucket.pick(),
        },
        positionOrVaultId: randomId(),
        history: [
          { timestamp: randomTimestamp(), status: 'MINED' },
          { timestamp: randomTimestamp(), status: 'SENT' },
        ],
        stateUpdateId: 1234,
      })
    },
  },
  {
    path: '/transactions/initialize-escape/reverted',
    description:
      'Transaction view of a reverted initialize escape transaction.',
    isTransactionPage: true,
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderInitializeEscapePage({
        context,
        transactionHash: Hash256.fake(),
        recipient: randomRecipient(),
        dataFromL1: {
          asset: { hashOrId: AssetId('USDC-6') },
          amount: amountBucket.pick(),
        },
        positionOrVaultId: randomId(),
        history: [
          { timestamp: randomTimestamp(), status: 'REVERTED' },
          { timestamp: randomTimestamp(), status: 'SENT' },
        ],
        stateUpdateId: 1234,
      })
    },
  },
  {
    path: '/transactions/finalize-escape/sent',
    description: 'Transaction view of a sent finalize escape transaction.',
    isTransactionPage: true,
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderFinalizeEscapeDetailsPage({
        context,
        transactionHash: Hash256.fake(),
        recipient: randomRecipient(),
        positionOrVaultId: randomId(),
        asset: { hashOrId: AssetId('USDC-6') },
        amount: amountBucket.pick(),
        history: [{ timestamp: randomTimestamp(), status: 'SENT' }],
      })
    },
  },
  {
    path: '/transactions/finalize-escape/mined',
    description: 'Transaction view of a mined finalize escape transaction.',
    isTransactionPage: true,
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderFinalizeEscapeDetailsPage({
        context,
        transactionHash: Hash256.fake(),
        recipient: randomRecipient(),
        positionOrVaultId: randomId(),
        asset: { hashOrId: AssetId('USDC-6') },
        amount: amountBucket.pick(),
        history: [
          { timestamp: randomTimestamp(), status: 'MINED' },
          { timestamp: randomTimestamp(), status: 'SENT' },
        ],
      })
    },
  },
  {
    path: '/transactions/finalize-escape/reverted',
    description: 'Transaction view of a mined finalize escape transaction.',
    isTransactionPage: true,
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderFinalizeEscapeDetailsPage({
        context,
        transactionHash: Hash256.fake(),
        recipient: randomRecipient(),
        positionOrVaultId: randomId(),
        asset: { hashOrId: AssetId('USDC-6') },
        amount: amountBucket.pick(),
        history: [
          { timestamp: randomTimestamp(), status: 'REVERTED' },
          { timestamp: randomTimestamp(), status: 'SENT' },
        ],
      })
    },
    breakAfter: true,
  },

  // #endregion
  // #region Offers and transactions
  {
    path: '/transactions/:hash',
    link: '/transactions/random',
    description: 'Random transaction page.',
    render: (ctx) => {
      const txRoutes = routes.filter((x) => x.isTransactionPage)
      const route = txRoutes[randomInt(0, txRoutes.length - 1)]
      route?.render(ctx)
    },
  },
  {
    path: '/offers/:id',
    link: '/offers/random',
    description: 'Random offer page.',
    breakAfter: true,
    render: (ctx) => {
      const offerRoutes = routes.filter((x) => x.isOfferPage)
      const route = offerRoutes[randomInt(0, offerRoutes.length - 1)]
      route?.render(ctx)
    },
  },
  // #endregion
  // #region View spot withdraw
  {
    path: '/transactions/spot-forced-withdrawal/sent',
    description: 'Transaction view of a sent spot forced withdrawal.',
    isTransactionPage: true,
    render: (ctx) => {
      const context = getSpotPageContext(ctx)
      ctx.body = renderSpotForcedWithdrawalPage({
        context,
        transactionHash: Hash256.fake(),
        recipient: randomRecipient(),
        vaultId: randomId(),
        history: [{ timestamp: randomTimestamp(), status: 'SENT' }],
      })
    },
  },
  {
    path: '/transactions/spot-forced-withdrawal/mined',
    description: 'Transaction view of a mined spot forced withdrawal.',
    isTransactionPage: true,
    render: (ctx) => {
      const context = getSpotPageContext(ctx)
      ctx.body = renderSpotForcedWithdrawalPage({
        context,
        transactionHash: Hash256.fake(),
        recipient: randomRecipient(),
        vaultId: randomId(),
        history: [
          { timestamp: randomTimestamp(), status: 'MINED' },
          { timestamp: randomTimestamp(), status: 'SENT' },
        ],
      })
    },
  },
  {
    path: '/transactions/spot-forced-withdrawal/reverted',
    description: 'Transaction view of a reverted spot forced withdrawal.',
    isTransactionPage: true,
    render: (ctx) => {
      const context = getSpotPageContext(ctx)
      ctx.body = renderSpotForcedWithdrawalPage({
        context,
        transactionHash: Hash256.fake(),
        recipient: randomRecipient(),
        vaultId: randomId(),
        history: [
          { timestamp: randomTimestamp(), status: 'REVERTED' },
          { timestamp: randomTimestamp(), status: 'SENT' },
        ],
      })
    },
  },
  {
    path: '/transactions/spot-forced-withdrawal/included',
    description: 'Transaction view of an included spot forced withdrawal.',
    isTransactionPage: true,
    breakAfter: true,
    render: (ctx) => {
      const context = getSpotPageContext(ctx)
      ctx.body = renderSpotForcedWithdrawalPage({
        context,
        transactionHash: Hash256.fake(),
        recipient: randomRecipient(),
        vaultId: randomId(),
        history: [
          { timestamp: randomTimestamp(), status: 'INCLUDED' },
          { timestamp: randomTimestamp(), status: 'MINED' },
          { timestamp: randomTimestamp(), status: 'SENT' },
        ],
        stateUpdateId: 1234,
      })
    },
  },
  // #endregion
  // #region View perpetual withdraw
  {
    path: '/transactions/perpetual-forced-withdrawal/sent',
    description: 'Transaction view of a sent perpetual forced withdrawal.',
    isTransactionPage: true,
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderPerpetualForcedWithdrawalPage({
        context,
        transactionHash: Hash256.fake(),
        recipient: randomRecipient(),
        asset: { hashOrId: AssetId('USDC-6') },
        amount: amountBucket.pick(),
        positionId: randomId(),
        history: [{ timestamp: randomTimestamp(), status: 'SENT' }],
      })
    },
  },
  {
    path: '/transactions/perpetual-forced-withdrawal/mined',
    description: 'Transaction view of a mined perpetual forced withdrawal.',
    isTransactionPage: true,
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderPerpetualForcedWithdrawalPage({
        context,
        transactionHash: Hash256.fake(),
        recipient: randomRecipient(),
        asset: { hashOrId: AssetId('USDC-6') },
        amount: amountBucket.pick(),
        positionId: randomId(),
        history: [
          { timestamp: randomTimestamp(), status: 'MINED' },
          { timestamp: randomTimestamp(), status: 'SENT' },
        ],
      })
    },
  },
  {
    path: '/transactions/perpetual-forced-withdrawal/reverted',
    description: 'Transaction view of a reverted perpetual forced withdrawal.',
    isTransactionPage: true,
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderPerpetualForcedWithdrawalPage({
        context,
        transactionHash: Hash256.fake(),
        recipient: randomRecipient(),
        asset: { hashOrId: AssetId('USDC-6') },
        amount: amountBucket.pick(),
        positionId: randomId(),
        history: [
          { timestamp: randomTimestamp(), status: 'REVERTED' },
          { timestamp: randomTimestamp(), status: 'SENT' },
        ],
      })
    },
  },
  {
    path: '/transactions/perpetual-forced-withdrawal/included',
    description: 'Transaction view of an included perpetual forced withdrawal.',
    isTransactionPage: true,
    breakAfter: true,
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderPerpetualForcedWithdrawalPage({
        context,
        transactionHash: Hash256.fake(),
        recipient: randomRecipient(),
        asset: { hashOrId: AssetId('USDC-6') },
        amount: amountBucket.pick(),
        positionId: randomId(),
        history: [
          { timestamp: randomTimestamp(), status: 'INCLUDED' },
          { timestamp: randomTimestamp(), status: 'MINED' },
          { timestamp: randomTimestamp(), status: 'SENT' },
        ],
        stateUpdateId: 1234,
      })
    },
  },
  // #endregion
  // #region View perpetual trade
  {
    path: '/offers/xyz/created/creator',
    description:
      'Offer view of a created perpetual forced trade. As viewed by the creator.',
    isOfferPage: true,
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx, {
        fallbackToFakeUser: true,
      })
      const offer = randomOfferDetails()
      ctx.body = renderOfferAndForcedTradePage({
        context,
        maker: userParty(context.user),
        ...offer,
        history: [{ timestamp: randomTimestamp(), status: 'CREATED' }],
        cancelOfferFormData: {
          offerId: Number(offer.offerId),
          address: context.user.address,
        },
      })
    },
  },
  {
    path: '/offers/xyz/created/someone',
    description:
      'Offer view of a created perpetual forced trade. As viewed by someone else.',
    isOfferPage: true,
    render: (ctx) => {
      const offer = randomOfferDetails()
      const context = getPerpetualPageContext(ctx, {
        fallbackToFakeUser: true,
      })
      const taker = {
        ethereumAddress: context.user.address,
        starkKey: context.user.starkKey,
        positionId: randomId(),
      }
      const maker = randomParty()
      ctx.body = renderOfferAndForcedTradePage({
        context,
        maker: randomParty(),
        ...offer,
        history: [{ timestamp: randomTimestamp(), status: 'CREATED' }],
        acceptOfferFormData: {
          id: Number(offer.offerId),
          address: context.user.address,
          starkKeyA: maker.starkKey,
          positionIdA: BigInt(maker.positionId),
          syntheticAssetId: AssetId('ETH-9'),
          collateralAmount: 2n,
          syntheticAmount: 1n,
          isABuyingSynthetic: true,
          starkKeyB: taker.starkKey ?? StarkKey.fake(),
          positionIdB: BigInt(taker.positionId),
          submissionExpirationTime: Timestamp(12345678),
          nonce: 1234n,
          premiumCost: false,
          collateralAsset: context.collateralAsset,
        },
      })
    },
  },
  {
    path: '/transactions/xyz/accepted/creator',
    description:
      'Offer view of an accepted perpetual forced trade. As viewed by the creator.',
    isOfferPage: true,
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx, {
        fallbackToFakeUser: true,
      })
      const maker = userParty(context.user)
      const taker = randomParty()
      const offer = randomOfferDetails()
      ctx.body = renderOfferAndForcedTradePage({
        context,
        maker,
        taker,
        ...offer,
        history: [
          { timestamp: randomTimestamp(), status: 'ACCEPTED' },
          { timestamp: randomTimestamp(), status: 'CREATED' },
        ],
        cancelOfferFormData: {
          offerId: Number(offer.offerId),
          address: context.user.address,
        },
        finalizeOfferFormData: {
          collateralAsset: context.collateralAsset,
          offerId: Number(offer.offerId),
          address: context.user.address,
          perpetualAddress: EthereumAddress.fake(),
          starkKeyA: maker.starkKey,
          positionIdA: BigInt(maker.positionId),
          syntheticAssetId: AssetId('ETH-9'),
          collateralAmount: 2n,
          syntheticAmount: 1n,
          isABuyingSynthetic: true,
          starkKeyB: taker.starkKey,
          positionIdB: BigInt(taker.positionId),
          submissionExpirationTime: Timestamp(12345678),
          nonce: 1234n,
          premiumCost: false,
          signature: Hash256.fake().toString(),
        },
      })
    },
  },
  {
    path: '/transactions/xyz/accepted/someone',
    description:
      'Offer view of an accepted perpetual forced trade. As viewed by someone else.',
    isOfferPage: true,
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderOfferAndForcedTradePage({
        context,
        maker: randomParty(),
        taker: randomParty(),
        ...randomOfferDetails(),
        history: [
          { timestamp: randomTimestamp(), status: 'ACCEPTED' },
          { timestamp: randomTimestamp(), status: 'CREATED' },
        ],
      })
    },
  },
  {
    path: '/offers/xyz/cancelled',
    description: 'Offer view of a cancelled perpetual forced trade.',
    isOfferPage: true,
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderOfferAndForcedTradePage({
        context,
        maker: randomParty(),
        ...randomOfferDetails(),
        history: [
          { timestamp: randomTimestamp(), status: 'CANCELLED' },
          { timestamp: randomTimestamp(), status: 'CREATED' },
        ],
      })
    },
  },
  {
    path: '/offers/xyz/expired',
    description: 'Offer view of an expired perpetual forced trade.',
    isOfferPage: true,
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderOfferAndForcedTradePage({
        context,
        maker: randomParty(),
        taker: randomParty(),
        ...randomOfferDetails(),
        history: [
          { timestamp: randomTimestamp(), status: 'EXPIRED' },
          { timestamp: randomTimestamp(), status: 'ACCEPTED' },
          { timestamp: randomTimestamp(), status: 'CREATED' },
        ],
      })
    },
  },
  {
    path: '/transactions/xyz/sent',
    description: 'Transaction view of a sent perpetual forced trade.',
    isOfferPage: true,
    isTransactionPage: true,
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderOfferAndForcedTradePage({
        context,
        transactionHash: Hash256.fake(),
        maker: randomParty(),
        taker: randomParty(),
        ...randomOfferDetails(),
        history: [
          { timestamp: randomTimestamp(), status: 'SENT' },
          { timestamp: randomTimestamp(), status: 'ACCEPTED' },
          { timestamp: randomTimestamp(), status: 'CREATED' },
        ],
      })
    },
  },
  {
    path: '/transactions/xyz/mined',
    description: 'Transaction view of a mined perpetual forced trade.',
    isOfferPage: true,
    isTransactionPage: true,
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderOfferAndForcedTradePage({
        context,
        transactionHash: Hash256.fake(),
        maker: randomParty(),
        taker: randomParty(),
        ...randomOfferDetails(),
        history: [
          { timestamp: randomTimestamp(), status: 'MINED' },
          { timestamp: randomTimestamp(), status: 'SENT' },
          { timestamp: randomTimestamp(), status: 'ACCEPTED' },
          { timestamp: randomTimestamp(), status: 'CREATED' },
        ],
      })
    },
  },
  {
    path: '/transactions/xyz/reverted',
    description: 'Transaction view of a reverted perpetual forced trade.',
    isOfferPage: true,
    isTransactionPage: true,
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderOfferAndForcedTradePage({
        context,
        transactionHash: Hash256.fake(),
        maker: randomParty(),
        taker: randomParty(),
        ...randomOfferDetails(),
        history: [
          { timestamp: randomTimestamp(), status: 'REVERTED' },
          { timestamp: randomTimestamp(), status: 'SENT' },
          { timestamp: randomTimestamp(), status: 'ACCEPTED' },
          { timestamp: randomTimestamp(), status: 'CREATED' },
        ],
      })
    },
  },
  {
    path: '/transactions/xyz/included',
    description: 'Transaction view of an included perpetual forced trade.',
    isOfferPage: true,
    isTransactionPage: true,
    breakAfter: true,
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderOfferAndForcedTradePage({
        context,
        transactionHash: Hash256.fake(),
        maker: randomParty(),
        taker: randomParty(),
        ...randomOfferDetails(),
        history: [
          { timestamp: randomTimestamp(), status: 'INCLUDED' },
          { timestamp: randomTimestamp(), status: 'MINED' },
          { timestamp: randomTimestamp(), status: 'SENT' },
          { timestamp: randomTimestamp(), status: 'ACCEPTED' },
          { timestamp: randomTimestamp(), status: 'CREATED' },
        ],
        stateUpdateId: 1234,
      })
    },
  },
  // #endregion
  // #region View regular withdrawal
  {
    path: '/transactions/regular-withdrawal/sent',
    description: 'Transaction view of a sent withdrawal.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderRegularWithdrawalPage({
        context,
        recipient: randomRecipient(),
        asset: assetBucket.pick(),
        transactionHash: Hash256.fake(),
        history: [{ timestamp: randomTimestamp(), status: 'SENT' }],
      })
    },
  },
  {
    path: '/transactions/regular-withdrawal/mined',
    description: 'Transaction view of a mined withdrawal.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderRegularWithdrawalPage({
        context,
        recipient: randomRecipient(),
        amount: amountBucket.pick(),
        asset: assetBucket.pick(),
        transactionHash: Hash256.fake(),
        history: [
          { timestamp: randomTimestamp(), status: 'MINED' },
          { timestamp: randomTimestamp(), status: 'SENT' },
        ],
      })
    },
  },
  {
    path: '/transactions/regular-withdrawal/reverted',
    description: 'Transaction view of a reverted withdrawal.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderRegularWithdrawalPage({
        context,
        recipient: randomRecipient(),
        asset: assetBucket.pick(),
        transactionHash: Hash256.fake(),
        history: [
          { timestamp: randomTimestamp(), status: 'REVERTED' },
          { timestamp: randomTimestamp(), status: 'SENT' },
        ],
      })
    },
    breakAfter: true,
  },
  // #endregion
  // #region Tutorial
  {
    path: '/tutorials',
    description: 'List of all tutorials',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderTutorialsPage({
        context,
        tutorials,
      })
    },
  },
  {
    link: '/tutorials/example',
    path: '/tutorials/:slug',
    description: 'Tutorial page',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderTutorialPage({
        context,
        articleContent: tutorial,
        slug: 'example',
      })
    },
    breakAfter: true,
  },
  // #endregion
  // #region Error pages
  {
    path: '/error/not-found',
    description: 'Not found error page',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderErrorPage({
        context,
        statusCode: 404,
        message: "We couldn't find the page you were looking for.",
      })
    },
  },
  {
    path: '/error/bad-request',
    description: 'Bad request error page',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderErrorPage({
        context,
        statusCode: 400,
      })
    },
  },
  {
    path: '/error/internal-server-error',
    description: 'Internal server error page',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      ctx.body = renderErrorPage({
        context,
        statusCode: 500,
      })
    },
  },
  // #endregion
]

for (const route of routes) {
  router.get(route.path, route.render)
}

function getPagination(ctx: Koa.Context, total: number) {
  const page = ctx.query.page ? parseInt(ctx.query.page as string, 10) : 1
  const perPage = ctx.query.perPage
    ? parseInt(ctx.query.perPage as string, 10)
    : 50
  const limit = Math.min(Math.max(perPage, 10), 200)
  const offset = Math.max(page - 1, 0) * limit
  if (offset > total) {
    return { limit, offset: 0, visible: 0 }
  } else if (offset + limit > total) {
    return { limit, offset, visible: total - offset }
  } else {
    return { limit, offset, visible: limit }
  }
}

function getUser(ctx: Koa.Context): UserDetails | undefined {
  const account = ctx.cookies.get('account')
  const starkKey = ctx.cookies.get('starkKey')

  if (account) {
    try {
      return {
        address: EthereumAddress(account),
        starkKey: starkKey ? StarkKey(starkKey) : undefined,
      }
    } catch {
      return
    }
  }
}

function getFakeUser() {
  return {
    address: EthereumAddress.fake(),
    starkKey: StarkKey.fake(),
  }
}

function getPerpetualPageContext(
  ctx: Koa.Context,
  options?: {
    fallbackToFakeUser?: true
    showL2Transactions?: boolean
  }
): PageContextWithUser<'perpetual'>
function getPerpetualPageContext(
  ctx: Koa.Context,
  options?: {
    fallbackToFakeUser?: false
    showL2Transactions?: boolean
  }
): PageContext<'perpetual'>
function getPerpetualPageContext(
  ctx: Koa.Context,
  options?: {
    fallbackToFakeUser?: boolean
    showL2Transactions?: boolean
  }
): PageContextWithUser<'perpetual'> | PageContext<'perpetual'> {
  const user =
    getUser(ctx) ?? (options?.fallbackToFakeUser ? getFakeUser() : undefined)

  return {
    user,
    showL2Transactions: options?.showL2Transactions ?? false,
    instanceName: 'dYdX',
    chainId: 1,
    tradingMode: 'perpetual',
    collateralAsset: fakeCollateralAsset,
    freezeStatus: 'not-frozen',
  } as const
}

function getSpotPageContext(
  ctx: Koa.Context,
  options?: {
    fallbackToFakeUser?: true
    showL2Transactions?: boolean
  }
): PageContextWithUser<'spot'>
function getSpotPageContext(
  ctx: Koa.Context,
  options?: {
    fallbackToFakeUser?: false
    showL2Transactions?: boolean
  }
): PageContext<'spot'>
function getSpotPageContext(
  ctx: Koa.Context,
  options?: {
    fallbackToFakeUser?: boolean
    showL2Transactions?: boolean
  }
): PageContextWithUser<'spot'> | PageContext<'spot'> {
  const user =
    getUser(ctx) ?? (options?.fallbackToFakeUser ? getFakeUser() : undefined)

  return {
    user,
    showL2Transactions: options?.showL2Transactions ?? false,
    instanceName: 'Myria',
    chainId: 1,
    tradingMode: 'spot',
    freezeStatus: 'not-frozen',
  } as const
}
