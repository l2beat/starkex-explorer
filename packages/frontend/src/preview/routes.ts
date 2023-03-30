/* eslint-disable import/no-extraneous-dependencies */
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
  renderHomeOffersPage,
  renderHomePage,
  renderHomeStateUpdatesPage,
  renderHomeTransactionsPage,
  renderNewPerpetualForcedActionPage,
  renderNotFoundPage,
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
  renderUserTransactionsPage,
} from '../view'
import { renderDevPage } from '../view/pages/DevPage'
import { renderNewSpotForcedWithdrawPage } from '../view/pages/forced-actions/NewSpotForcedWithdrawalPage'
import { renderMerkleProofPage } from '../view/pages/MerkleProofPage'
import { amountBucket, assetBucket } from './data/buckets'
import {
  randomHomeForcedTransactionEntry,
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
      const user = getUser(ctx)

      ctx.body = renderHomePage({
        user,
        stateUpdates: repeat(6, randomHomeStateUpdateEntry),
        totalStateUpdates: 5123,
        transactions: repeat(6, randomHomeForcedTransactionEntry),
        totalForcedTransactions: 68,
        offers: repeat(6, randomHomeOfferEntry),
        totalOffers: 7,
        tradingMode: 'perpetual',
      })
    },
  },
  {
    path: '/home/no-tutorials',
    description: 'The home page, but without any tutorials.',
    render: (ctx) => {
      const user = getUser(ctx)
      ctx.body = renderHomePage({
        user,
        tutorials: [],
        stateUpdates: repeat(6, randomHomeStateUpdateEntry),
        totalStateUpdates: 5123,
        transactions: repeat(6, randomHomeForcedTransactionEntry),
        totalForcedTransactions: 68,
        offers: repeat(6, randomHomeOfferEntry),
        totalOffers: 7,
        tradingMode: 'perpetual',
      })
    },
  },
  {
    path: '/state-updates',
    description:
      'State update list accessible from home page. Supports pagination.',
    render: (ctx) => {
      const user = getUser(ctx)
      const total = 5123
      const { limit, offset, visible } = getPagination(ctx, total)
      ctx.body = renderHomeStateUpdatesPage({
        user,
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
      const user = getUser(ctx)
      const total = 68
      const { limit, offset, visible } = getPagination(ctx, total)
      ctx.body = renderHomeTransactionsPage({
        user,
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
      const user = getUser(ctx)
      const total = 68
      const { limit, offset, visible } = getPagination(ctx, total)
      ctx.body = renderHomeOffersPage({
        user,
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
      const user = getUser(ctx)
      ctx.body = renderMerkleProofPage({
        user,
        positionOrVaultId: BigInt(randomId()),
        tradingMode: 'spot',
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
      const user = getUser(ctx)
      ctx.body = renderStateUpdatePage({
        user,
        tradingMode: 'perpetual',
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
      const user = getUser(ctx)
      const total = 231
      const { limit, offset, visible } = getPagination(ctx, total)
      ctx.body = renderStateUpdateBalanceChangesPage({
        user,
        tradingMode: 'perpetual',
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
      const user = getUser(ctx)
      const total = 231
      const { limit, offset, visible } = getPagination(ctx, total)
      ctx.body = renderStateUpdateTransactionsPage({
        user,
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
    path: '/users/register',
    description: 'My user page, the stark key is known and registered.',
    render: (ctx) => {
      const user = getUser(ctx)
      ctx.body = renderUserPage({
        user,
        tradingMode: 'perpetual',
        starkKey: StarkKey.fake(),
        ethereumAddress: EthereumAddress.fake(),
        exchangeAddress: EthereumAddress.fake(),
        withdrawableAssets: repeat(3, randomWithdrawableAssetEntry),
        offersToAccept: [],
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
    path: '/users/:starkKey',
    link: '/users/someone',
    description: 'Someone else’s user page.',
    render: notFound,
  },
  {
    path: '/users/me/unregistered',
    description:
      'My user page, the stark key is known, but it’s not registered.',
    render: notFound,
  },
  {
    path: '/users/me/registered',
    description: 'My user page, the stark key is known and registered.',
    render: (ctx) => {
      const user = getUser(ctx) ?? getFakeUser()
      ctx.body = renderUserPage({
        user,
        tradingMode: 'perpetual',
        starkKey: user.starkKey ?? StarkKey.fake(),
        ethereumAddress: user.address,
        exchangeAddress: EthereumAddress.fake(),
        withdrawableAssets: repeat(3, randomWithdrawableAssetEntry),
        offersToAccept: repeat(2, randomUserOfferEntry),
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
  // #endregion
  // #region User lists

  {
    path: '/users/:starkKey/assets',
    link: '/users/someone/assets',
    description:
      'Assets list accessible from someone else’s user page. Supports pagination.',
    render: (ctx) => {
      const user = getUser(ctx)
      const total = 7
      const { limit, offset, visible } = getPagination(ctx, total)
      ctx.body = renderUserAssetsPage({
        user,
        tradingMode: 'perpetual',
        starkKey: StarkKey.fake(),
        assets: repeat(visible, randomUserAssetEntry),
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
      const user = getUser(ctx)
      const total = 3367
      const { limit, offset, visible } = getPagination(ctx, total)
      ctx.body = renderUserBalanceChangesPage({
        user,
        tradingMode: 'perpetual',
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
      const user = getUser(ctx)
      const total = 48
      const { limit, offset, visible } = getPagination(ctx, total)
      ctx.body = renderUserTransactionsPage({
        user,
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
      const user = getUser(ctx)
      const total = 6
      const { limit, offset, visible } = getPagination(ctx, total)
      ctx.body = renderUserOffersPage({
        user,
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
      const user = getUser(ctx) ?? getFakeUser()
      ctx.body = renderNewSpotForcedWithdrawPage({
        user,
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
      const user = getUser(ctx) ?? getFakeUser()
      ctx.body = renderNewPerpetualForcedActionPage({
        user,
        starkKey: StarkKey.fake(),
        starkExAddress: EthereumAddress.fake(),
        asset: {
          hashOrId: AssetId.USDC,
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
      const user = getUser(ctx) ?? getFakeUser()
      ctx.body = renderNewPerpetualForcedActionPage({
        user,
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
      const user = getUser(ctx) ?? getFakeUser()
      ctx.body = renderNewPerpetualForcedActionPage({
        user,
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
      const user = getUser(ctx)
      ctx.body = renderSpotForcedWithdrawalPage({
        user,
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
      const user = getUser(ctx)
      ctx.body = renderSpotForcedWithdrawalPage({
        user,
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
      const user = getUser(ctx)
      ctx.body = renderSpotForcedWithdrawalPage({
        user,
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
      const user = getUser(ctx)
      ctx.body = renderSpotForcedWithdrawalPage({
        user,
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
      const user = getUser(ctx)
      ctx.body = renderPerpetualForcedWithdrawalPage({
        user,
        transactionHash: Hash256.fake(),
        recipient: randomRecipient(),
        asset: { hashOrId: AssetId.USDC },
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
      const user = getUser(ctx)
      ctx.body = renderPerpetualForcedWithdrawalPage({
        user,
        transactionHash: Hash256.fake(),
        recipient: randomRecipient(),
        asset: { hashOrId: AssetId.USDC },
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
      const user = getUser(ctx)
      ctx.body = renderPerpetualForcedWithdrawalPage({
        user,
        transactionHash: Hash256.fake(),
        recipient: randomRecipient(),
        asset: { hashOrId: AssetId.USDC },
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
      const user = getUser(ctx)
      ctx.body = renderPerpetualForcedWithdrawalPage({
        user,
        transactionHash: Hash256.fake(),
        recipient: randomRecipient(),
        asset: { hashOrId: AssetId.USDC },
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
      const user = getUser(ctx) ?? getFakeUser()
      const offer = randomOfferDetails()
      ctx.body = renderOfferAndForcedTradePage({
        user,
        maker: userParty(user),
        ...offer,
        history: [{ timestamp: randomTimestamp(), status: 'CREATED' }],
        cancelForm: {
          offerId: Number(offer.offerId),
          address: user.address,
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
      const user = getUser(ctx) ?? getFakeUser()
      const taker = {
        ethereumAddress: user.address,
        starkKey: user.starkKey,
        positionId: randomId(),
      }
      const maker = randomParty()
      ctx.body = renderOfferAndForcedTradePage({
        user,
        maker: randomParty(),
        ...offer,
        history: [{ timestamp: randomTimestamp(), status: 'CREATED' }],
        acceptForm: {
          id: Number(offer.offerId),
          address: user.address,
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
      const user = getUser(ctx) ?? getFakeUser()
      const maker = userParty(user)
      const taker = randomParty()
      const offer = randomOfferDetails()
      ctx.body = renderOfferAndForcedTradePage({
        user,
        maker,
        taker,
        ...offer,
        history: [
          { timestamp: randomTimestamp(), status: 'ACCEPTED' },
          { timestamp: randomTimestamp(), status: 'CREATED' },
        ],
        cancelForm: {
          offerId: Number(offer.offerId),
          address: user.address,
        },
        finalizeForm: {
          offerId: Number(offer.offerId),
          address: user.address,
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
      const user = getUser(ctx)
      ctx.body = renderOfferAndForcedTradePage({
        user,
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
      const user = getUser(ctx)
      ctx.body = renderOfferAndForcedTradePage({
        user,
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
      const user = getUser(ctx)
      ctx.body = renderOfferAndForcedTradePage({
        user,
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
      const user = getUser(ctx)
      ctx.body = renderOfferAndForcedTradePage({
        user,
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
      const user = getUser(ctx)
      ctx.body = renderOfferAndForcedTradePage({
        user,
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
      const user = getUser(ctx)
      ctx.body = renderOfferAndForcedTradePage({
        user,
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
      const user = getUser(ctx)
      ctx.body = renderOfferAndForcedTradePage({
        user,
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
      const user = getUser(ctx)
      ctx.body = renderRegularWithdrawalPage({
        user,
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
      const user = getUser(ctx)
      ctx.body = renderRegularWithdrawalPage({
        user,
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
      const user = getUser(ctx)
      ctx.body = renderRegularWithdrawalPage({
        user,
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

function notFound(ctx: Koa.Context) {
  const account = getUser(ctx)
  ctx.body = renderNotFoundPage({ account })
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

function getUser(ctx: Koa.Context) {
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
