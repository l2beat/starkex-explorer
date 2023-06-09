/* eslint-disable import/no-extraneous-dependencies */
import {
  CollateralAsset,
  PageContext,
  PageContextWithUser,
  UserDetails,
} from '@explorer/shared'
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
  renderHomeL2TransactionsPage,
  renderHomeOffersPage,
  renderHomePage,
  renderHomeStateUpdatesPage,
  renderHomeTransactionsPage,
  renderMerkleProofPage,
  renderNewPerpetualForcedActionPage,
  renderNewSpotForcedWithdrawPage,
  renderOfferAndForcedTradePage,
  renderPerpetualForcedWithdrawalPage,
  renderRegularWithdrawalPage,
  renderSpotForcedWithdrawalPage,
  renderStateUpdateBalanceChangesPage,
  renderStateUpdatePage,
  renderStateUpdateTransactionsPage,
  renderUserAssetsPage,
  renderUserBalanceChangesPage,
  renderUserOffersPage,
  renderUserPage,
  renderUserRecoverPage,
  renderUserRegisterPage,
  renderUserTransactionsPage,
} from '../view'
import { renderDevPage } from '../view/pages/DevPage'
import { renderUserL2TransactionsPage } from '../view/pages/user/UserL2TransactionsPage'
import { amountBucket, assetBucket } from './data/buckets'
import {
  randomHomeForcedTransactionEntry,
  randomHomeL2TransactionEntry,
  randomHomeOfferEntry,
  randomHomeStateUpdateEntry,
} from './data/home'
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
import {
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
        stateUpdates: repeat(6, randomHomeStateUpdateEntry),
        totalStateUpdates: 5123,
        forcedTransactions: repeat(6, randomHomeForcedTransactionEntry),
        totalForcedTransactions: 68,
        offers: repeat(6, randomHomeOfferEntry),
        totalOffers: 7,
      })
    },
  },
  {
    path: '/home/with-l2-transactions',
    description:
      'The home page for project that shared feeder gateway with us.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)

      ctx.body = renderHomePage({
        context,
        stateUpdates: repeat(6, randomHomeStateUpdateEntry),
        totalStateUpdates: 5123,
        l2Transactions: {
          data: repeat(6, randomHomeL2TransactionEntry),
          total: 5123,
        },
        tutorials: [],
        forcedTransactions: repeat(6, randomHomeForcedTransactionEntry),
        totalForcedTransactions: 68,
        offers: repeat(6, randomHomeOfferEntry),
        totalOffers: 7,
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
        stateUpdates: repeat(6, randomHomeStateUpdateEntry),
        totalStateUpdates: 5123,
        forcedTransactions: repeat(6, randomHomeForcedTransactionEntry),
        totalForcedTransactions: 68,
        offers: repeat(6, randomHomeOfferEntry),
        totalOffers: 7,
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
        context: getPerpetualPageContext(ctx),
        l2Transactions: repeat(visible, randomHomeL2TransactionEntry),
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
    description: 'Offer list accessible from home page. Supports pagination.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx)
      const total = 68
      const { limit, offset, visible } = getPagination(ctx, total)
      ctx.body = renderHomeOffersPage({
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
        hashes: {
          factHash: Hash256.fake(),
          positionTreeRoot: PedersenHash.fake(),
          onChainVaultTreeRoot: PedersenHash.fake(),
          offChainVaultTreeRoot: PedersenHash.fake(),
          orderRoot: PedersenHash.fake(),
        },
        blockNumber: randomInt(14_000_000, 17_000_000),
        ethereumTimestamp,
        starkExTimestamp: Timestamp(
          Math.floor(
            Number(ethereumTimestamp) - Math.random() * 12 * 60 * 60 * 1000
          )
        ),
        balanceChanges: repeat(10, randomStateUpdateBalanceChangeEntry),
        priceChanges: repeat(15, randomStateUpdatePriceEntry),
        totalBalanceChanges: 231,
        transactions: repeat(5, randomStateUpdateTransactionEntry),
        totalTransactions: 5,
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
      const context = getPerpetualPageContext(ctx, true)
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
      const context = getPerpetualPageContext(ctx, true)

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
      const context = getPerpetualPageContext(ctx, true)
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
        totalAssets: 7,
        balanceChanges: repeat(10, randomUserBalanceChangeEntry),
        totalBalanceChanges: 3367,
        transactions: repeat(10, randomUserTransactionEntry),
        totalTransactions: 48,
        offers: repeat(6, randomUserOfferEntry),
        totalOffers: 6,
      })
    },
  },
  {
    path: '/users/me/registered',
    description: 'My user page, the stark key is known and registered.',
    render: (ctx) => {
      const context = getPerpetualPageContext(ctx, true)
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
        totalAssets: 7,
        balanceChanges: repeat(10, randomUserBalanceChangeEntry),
        totalBalanceChanges: 3367,
        transactions: repeat(10, randomUserTransactionEntry),
        totalTransactions: 48,
        offers: repeat(6, randomUserOfferEntry),
        totalOffers: 6,
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
        totalAssets: 7,
        balanceChanges: repeat(10, randomUserBalanceChangeEntry),
        totalBalanceChanges: 3367,
        transactions: repeat(10, randomUserTransactionEntry),
        totalTransactions: 48,
        offers: repeat(6, randomUserOfferEntry),
        totalOffers: 6,
      })
    },
  },
  {
    path: '/users/:starkKey/with-l2-transactions',
    link: '/users/someone/with-l2-transactions',
    description:
      'Someone else’s user page for project that feeder gateway with us.',
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
        totalAssets: 7,
        balanceChanges: repeat(10, randomUserBalanceChangeEntry),
        totalBalanceChanges: 3367,
        transactions: repeat(10, randomUserTransactionEntry),
        totalTransactions: 48,
        l2Transactions: {
          data: repeat(6, randomHomeL2TransactionEntry),
          total: 5123,
        },
        offers: repeat(6, randomUserOfferEntry),
        totalOffers: 6,
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
        l2Transactions: repeat(visible, randomHomeL2TransactionEntry),
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
        offers: repeat(visible, randomUserOfferEntry),
        limit,
        offset,
        total,
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
      const context = getSpotPageContext(ctx, true)
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
      const context = getPerpetualPageContext(ctx, true)
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
      const context = getPerpetualPageContext(ctx, true)
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
      const context = getPerpetualPageContext(ctx, true)
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
      const context = getPerpetualPageContext(ctx, true)
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
      const context = getPerpetualPageContext(ctx, true)
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
      const context = getPerpetualPageContext(ctx, true)
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

const fakeCollateralAsset: CollateralAsset = {
  assetId: AssetId('USDC-6'),
  assetHash: AssetHash.fake(),
  price: 1_000_000n,
}

function getPerpetualPageContext(
  ctx: Koa.Context,
  fallbackToFakeUser: true
): PageContextWithUser<'perpetual'>
function getPerpetualPageContext(
  ctx: Koa.Context,
  fallbackToFakeUser?: false
): PageContext<'perpetual'>
function getPerpetualPageContext(
  ctx: Koa.Context,
  fallbackToFakeUser?: boolean
): PageContextWithUser<'perpetual'> | PageContext<'perpetual'> {
  const user = getUser(ctx) ?? (fallbackToFakeUser ? getFakeUser() : undefined)

  return {
    user,
    instanceName: 'dYdX',
    tradingMode: 'perpetual',
    collateralAsset: fakeCollateralAsset,
  } as const
}

function getSpotPageContext(
  ctx: Koa.Context,
  fallbackToFakeUser: true
): PageContextWithUser<'spot'>
function getSpotPageContext(
  ctx: Koa.Context,
  fallbackToFakeUser?: false
): PageContext<'spot'>
function getSpotPageContext(
  ctx: Koa.Context,
  fallbackToFakeUser?: boolean
): PageContextWithUser<'spot'> | PageContext<'spot'> {
  const user = getUser(ctx) ?? (fallbackToFakeUser ? getFakeUser() : undefined)

  return {
    user,
    instanceName: 'Myria',
    tradingMode: 'spot',
  } as const
}
