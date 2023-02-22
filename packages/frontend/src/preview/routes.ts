/* eslint-disable import/no-extraneous-dependencies */
import { EthereumAddress, PedersenHash, StarkKey } from '@explorer/types'
import Router from '@koa/router'
import { randomInt } from 'crypto'
import Koa from 'koa'

import {
  renderForcedTradePage,
  renderForcedWithdrawPage,
  renderHomeForcedTransactionsPage,
  renderHomeOffersPage,
  renderHomePage,
  renderHomeStateUpdatesPage,
  renderNotFoundPage,
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
import * as DATA from './data'
import {
  randomHomeForcedTransactionEntry,
  randomHomeOfferEntry,
  randomHomeStateUpdateEntry,
} from './data/home'
import {
  randomStateUpdateBalanceChangeEntry,
  randomStateUpdateTransactionEntry,
} from './data/stateUpdate'
import {
  randomUserAssetEntry,
  randomUserBalanceChangeEntry,
  randomUserOfferEntry,
  randomUserTransactionEntry,
} from './data/user'
import { randomId, randomTimestamp, repeat } from './data/utils'

export const router = new Router()

interface Route {
  path: string
  link?: string
  description: string
  breakAfter?: boolean // add bottom margin when displaying this route
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
      const user = getUser(ctx)
      ctx.body = renderHomePage({
        user,
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
      ctx.body = renderHomeForcedTransactionsPage({
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
    breakAfter: true,
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
  // #endregion
  // #region State update
  {
    path: '/state-updates/:id',
    link: '/state-updates/xyz',
    description: 'State update page.',
    render: (ctx) => {
      const user = getUser(ctx)
      ctx.body = renderStateUpdatePage({
        user,
        type: 'PERPETUAL',
        id: randomId(),
        stats: {
          hashes: {
            factHash: PedersenHash.fake(),
            positionTreeRoot: PedersenHash.fake(),
            onChainVaultTreeRoot: PedersenHash.fake(),
            offChainVaultTreeRoot: PedersenHash.fake(),
            orderRoot: PedersenHash.fake(),
          },
          blockNumber: randomInt(14_000_000, 17_000_000),
          ethereumTimestamp: randomTimestamp(),
          starkExTimestamp: randomTimestamp(),
        },
        balanceChanges: repeat(10, randomStateUpdateBalanceChangeEntry),
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
        type: 'PERPETUAL',
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
    path: '/users/:starkKey',
    link: '/users/someone',
    description: 'Someone else’s user page.',
    render: (ctx) => {
      const user = getUser(ctx)
      ctx.body = renderUserPage({
        user,
        type: 'PERPETUAL',
        starkKey: StarkKey.fake(),
        ethereumAddress: EthereumAddress.fake(),
        withdrawableAssets: [],
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
    path: '/users/me/unknown',
    description: 'My user page, but the stark key is unknown.',
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
    render: notFound,
    breakAfter: true,
  },
  // #endregion
  // #region User lists
  {
    path: '/users/me/assets',
    description:
      'Assets list accessible from my user page. Supports pagination.',
    render: (ctx) => {
      const user = getUser(ctx)
      const total = 7
      const { limit, offset, visible } = getPagination(ctx, total)
      ctx.body = renderUserAssetsPage({
        user,
        type: 'PERPETUAL',
        starkKey: StarkKey.fake(),
        assets: repeat(visible, randomUserAssetEntry),
        limit,
        offset,
        total,
      })
    },
  },
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
        type: 'PERPETUAL',
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
        type: 'PERPETUAL',
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
    description: 'Form to create a new spot forced withdraw.',
    render: notFound,
  },
  {
    path: '/forced/new/perpetual/withdraw',
    description: 'Form to create a new perpetual forced withdraw.',
    render: (ctx) => {
      const withdrawData = { ...DATA.FORCED_WITHDRAW_FORM_PROPS }
      withdrawData.user = getUser(ctx) ?? withdrawData.user
      ctx.body = renderForcedWithdrawPage(withdrawData)
    },
  },
  {
    path: '/forced/new/perpetual/buy',
    description: 'Form to create a new perpetual forced buy.',
    render: (ctx) => {
      const buyData = { ...DATA.FORCED_BUY_FORM_PROPS }
      buyData.user = getUser(ctx) ?? buyData.user
      ctx.body = renderForcedTradePage(buyData)
    },
  },
  {
    path: '/forced/new/perpetual/sell',
    description: 'Form to create a new perpetual forced sell.',
    breakAfter: true,
    render: (ctx) => {
      const sellData = { ...DATA.FORCED_SELL_FORM_PROPS }
      sellData.user = getUser(ctx) ?? sellData.user
      ctx.body = renderForcedTradePage(sellData)
    },
  },
  // #endregion
  // #region View spot withdraw
  {
    path: '/forced/spot/withdraw/sent',
    description: 'Transaction view of a sent spot forced withdraw.',
    render: notFound,
  },
  {
    path: '/forced/spot/withdraw/mined',
    description: 'Transaction view of a mined spot forced withdraw.',
    render: notFound,
  },
  {
    path: '/forced/spot/withdraw/reverted',
    description: 'Transaction view of a reverted spot forced withdraw.',
    render: notFound,
  },
  {
    path: '/forced/spot/withdraw/included',
    description: 'Transaction view of an included spot forced withdraw.',
    breakAfter: true,
    render: notFound,
  },
  // #endregion
  // #region View perpetual withdraw
  {
    path: '/forced/perpetual/withdraw/sent',
    description: 'Transaction view of a sent perpetual forced withdraw.',
    render: notFound,
  },
  {
    path: '/forced/perpetual/withdraw/mined',
    description: 'Transaction view of a mined perpetual forced withdraw.',
    render: notFound,
  },
  {
    path: '/forced/perpetual/withdraw/reverted',
    description: 'Transaction view of a reverted perpetual forced withdraw.',
    render: notFound,
  },
  {
    path: '/forced/perpetual/withdraw/included',
    description: 'Transaction view of an included perpetual forced withdraw.',
    breakAfter: true,
    render: notFound,
  },
  // #endregion
  // #region View perpetual trade
  {
    path: '/forced/perpetual/trade/created',
    description: 'Offer view of a created perpetual forced trade.',
    render: notFound,
  },
  {
    path: '/forced/perpetual/trade/accepted',
    description: 'Offer view of an accepted perpetual forced trade.',
    render: notFound,
  },
  {
    path: '/forced/perpetual/trade/cancelled',
    description: 'Offer view of a cancelled perpetual forced trade.',
    render: notFound,
  },
  {
    path: '/forced/perpetual/trade/expired',
    description: 'Offer view of an expired perpetual forced trade.',
    render: notFound,
  },
  {
    path: '/forced/perpetual/trade/sent',
    description: 'Transaction view of a sent perpetual forced trade.',
    render: notFound,
  },
  {
    path: '/forced/perpetual/trade/mined',
    description: 'Transaction view of a mined perpetual forced trade.',
    render: notFound,
  },
  {
    path: '/forced/perpetual/trade/reverted',
    description: 'Transaction view of a reverted perpetual forced trade.',
    render: notFound,
  },
  {
    path: '/forced/perpetual/trade/included',
    description: 'Transaction view of an included perpetual forced trade.',
    breakAfter: true,
    render: notFound,
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
        starkKey: starkKey ? StarkKey(starkKey) : StarkKey.fake(),
      }
    } catch {
      return
    }
  }
}
