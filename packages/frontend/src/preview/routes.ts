/* eslint-disable import/no-extraneous-dependencies */
import { EthereumAddress, StarkKey } from '@explorer/types'
import Router from '@koa/router'
import Koa from 'koa'

import { renderForcedWithdrawPage, renderHomePage } from '../view'
import { renderDevPage } from '../view/pages/DevPage'
import { renderForcedTradePage } from '../view/pages/forced-actions/ForcedTradePage'
import { renderNotFoundPage } from '../view/pages/NotFoundPage'
import * as DATA from './data'

export const router = new Router()

interface Route {
  path: string
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
      ctx.body = renderDevPage({ routes })
    },
  },
  {
    path: '/home',
    description: 'The home page.',
    render: (ctx) => {
      const user = getUser(ctx)
      ctx.body = renderHomePage({ user })
    },
  },
  {
    path: '/home/state-updates',
    description:
      'State update list accessible from home page. Supports pagination.',
    render: notFound,
  },
  {
    path: '/home/forced-transactions',
    description:
      'Forced transaction list accessible from home page. Supports pagination.',
    render: notFound,
  },
  {
    path: '/home/available-trades',
    description: 'Offer list accessible from home page. Supports pagination.',
    breakAfter: true,
    render: notFound,
  },
  // #endregion
  // #region State update
  {
    path: '/state-update',
    description: 'State update page.',
    render: notFound,
  },
  {
    path: '/state-update/balance-changes',
    description:
      'Balance change list accessible from state update page. Supports pagination.',
    render: notFound,
  },
  {
    path: '/state-update/forced-transactions',
    description:
      'Forced transaction list accessible from state update page. Supports pagination.',
    breakAfter: true,
    render: notFound,
  },
  // #endregion
  // #region User
  {
    path: '/user/someone',
    description: 'Someone else’s user page.',
    render: notFound,
  },
  {
    path: '/user/me/unknown',
    description: 'My user page, but the stark key is unknown.',
    render: notFound,
  },
  {
    path: '/user/me/unregistered',
    description:
      'My user page, the stark key is known, but it’s not registered.',
    render: notFound,
  },
  {
    path: '/user/me/registered',
    description: 'My user page, the stark key is known and registered.',
    render: notFound,
    breakAfter: true,
  },
  // #endregion
  // #region User lists
  {
    path: '/user/someone/assets',
    description:
      'Assets list accessible from someone else’s user page. Supports pagination.',
    render: notFound,
  },
  {
    path: '/user/me/assets',
    description:
      'Assets list accessible from my user page. Supports pagination.',
    render: notFound,
  },
  {
    path: '/user/balance-changes',
    description:
      'Balance change list accessible from user page. Supports pagination.',
    render: notFound,
  },
  {
    path: '/user/ethereum-transactions',
    description:
      'Ethereum transaction list accessible from user page. Supports pagination.',
    render: notFound,
  },
  {
    path: '/user/offers',
    description: 'Offer list accessible from user page. Supports pagination.',
    render: notFound,
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
