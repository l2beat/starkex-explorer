/* eslint-disable import/no-extraneous-dependencies */
import { AssetId, EthereumAddress } from '@explorer/types'
import Router from '@koa/router'
import Koa from 'koa'

import {
  renderForcedWithdrawPage,
  renderHomePage,
  renderUserPage,
} from '../view'
import { renderDevPage } from '../view/pages/DevPage'
import { renderForcedTradePage } from '../view/pages/forced-actions/ForcedTradePage'
import { renderNotFoundPage } from '../view/pages/NotFoundPage'
import * as DATA from './data'

export const router = new Router()

router.get('/', (ctx) => {
  const account = getAccount(ctx)
  ctx.body = renderHomePage({ title: 'foo', account })
})

router.get('/forced/new/:positionId/:assetId', (ctx) => {
  if (!ctx.params.positionId || !ctx.params.assetId) {
    return
  }
  const data = { ...DATA.FORCED_ACTION_FORM_PROPS }
  const positionId = ctx.params.positionId
  const assetId = AssetId(ctx.params.assetId)
  if (data.assets.find((asset) => asset.assetId === assetId) === undefined) {
    return
  }
  data.account = getAccount(ctx) ?? data.account
  data.selectedAsset = assetId
  data.positionId = BigInt(positionId)
  if (data.selectedAsset === AssetId.USDC) {
    ctx.body = renderForcedWithdrawPage(data)
    return
  }

  ctx.body = renderForcedTradePage(data)
})

router.get('/user', (ctx) => {
  const account = getAccount(ctx)
  ctx.body = renderUserPage({ ...DATA.USER_PROPS, account })
})

//DEV ROUTES

interface Route {
  path: string
  description: string
  breakAfter?: boolean
  render: (ctx: Koa.ParameterizedContext) => void
}

const routes: Route[] = [
  // #region Home
  {
    path: '/dev',
    description: 'A listing of all dev routes.',
    render: (ctx) => {
      ctx.body = renderDevPage({ routes })
    },
  },
  {
    path: '/dev/home',
    description: 'The home page.',
    render: notFound,
  },
  {
    path: '/dev/home/state-updates',
    description:
      'State update list accessible from home page. Supports pagination.',
    render: notFound,
  },
  {
    path: '/dev/home/forced-transactions',
    description:
      'Forced transaction list accessible from home page. Supports pagination.',
    render: notFound,
  },
  {
    path: '/dev/home/available-trades',
    description: 'Offer list accessible from home page. Supports pagination.',
    breakAfter: true,
    render: notFound,
  },
  // #endregion
  // #region State update
  {
    path: '/dev/state-update',
    description: 'State update page.',
    render: notFound,
  },
  {
    path: '/dev/state-update/balance-changes',
    description:
      'Balance change list accessible from state update page. Supports pagination.',
    render: notFound,
  },
  {
    path: '/dev/state-update/forced-transactions',
    description:
      'Forced transaction list accessible from state update page. Supports pagination.',
    breakAfter: true,
    render: notFound,
  },
  // #endregion
  // #region User
  {
    path: '/dev/user/someone',
    description: 'Someone else’s user page.',
    render: notFound,
  },
  {
    path: '/dev/user/me/unknown',
    description: 'My user page, but the stark key is unknown.',
    render: notFound,
  },
  {
    path: '/dev/user/me/unregistered',
    description:
      'My user page, the stark key is known, but it’s not registered.',
    render: notFound,
  },
  {
    path: '/dev/user/me/registered',
    description: 'My user page, the stark key is known and registered.',
    render: notFound,
    breakAfter: true,
  },
  // #endregion
  // #region User lists
  {
    path: '/dev/user/someone/assets',
    description:
      'Assets list accessible from someone else’s user page. Supports pagination.',
    render: notFound,
  },
  {
    path: '/dev/user/me/assets',
    description:
      'Assets list accessible from my user page. Supports pagination.',
    render: notFound,
  },
  {
    path: '/dev/user/balance-changes',
    description:
      'Balance change list accessible from user page. Supports pagination.',
    render: notFound,
  },
  {
    path: '/dev/user/ethereum-transactions',
    description:
      'Ethereum transaction list accessible from user page. Supports pagination.',
    render: notFound,
  },
  {
    path: '/dev/user/offers',
    description: 'Offer list accessible from user page. Supports pagination.',
    render: notFound,
    breakAfter: true,
  },
  // #endregion
  // #region Forced actions
  {
    path: '/dev/forced/new/spot/withdraw',
    description: 'Form to create a new spot forced withdraw.',
    render: notFound,
  },
  {
    path: '/dev/forced/new/perpetual/withdraw',
    description: 'Form to create a new perpetual forced withdraw.',
    render: (ctx) => {
      const withdrawData = { ...DATA.FORCED_WITHDRAW_FORM_PROPS }
      withdrawData.account = getAccount(ctx) ?? withdrawData.account
      ctx.body = renderForcedWithdrawPage(withdrawData)
    },
  },
  {
    path: '/dev/forced/new/perpetual/buy',
    description: 'Form to create a new perpetual forced buy.',
    render: (ctx) => {
      const buyData = { ...DATA.FORCED_BUY_FORM_PROPS }
      buyData.account = getAccount(ctx) ?? buyData.account
      ctx.body = renderForcedTradePage(buyData)
    },
  },
  {
    path: '/dev/forced/new/perpetual/sell',
    description: 'Form to create a new perpetual forced sell.',
    breakAfter: true,
    render: (ctx) => {
      const sellData = { ...DATA.FORCED_SELL_FORM_PROPS }
      sellData.account = getAccount(ctx) ?? sellData.account
      ctx.body = renderForcedTradePage(sellData)
    },
  },
  // #endregion
  // #region View spot withdraw
  {
    path: '/dev/forced/spot/withdraw/sent',
    description: 'Transaction view of a sent spot forced withdraw.',
    render: notFound,
  },
  {
    path: '/dev/forced/spot/withdraw/mined',
    description: 'Transaction view of a mined spot forced withdraw.',
    render: notFound,
  },
  {
    path: '/dev/forced/spot/withdraw/reverted',
    description: 'Transaction view of a reverted spot forced withdraw.',
    render: notFound,
  },
  {
    path: '/dev/forced/spot/withdraw/included',
    description: 'Transaction view of an included spot forced withdraw.',
    breakAfter: true,
    render: notFound,
  },
  // #endregion
  // #region View perpetual withdraw
  {
    path: '/dev/forced/perpetual/withdraw/sent',
    description: 'Transaction view of a sent perpetual forced withdraw.',
    render: notFound,
  },
  {
    path: '/dev/forced/perpetual/withdraw/mined',
    description: 'Transaction view of a mined perpetual forced withdraw.',
    render: notFound,
  },
  {
    path: '/dev/forced/perpetual/withdraw/reverted',
    description: 'Transaction view of a reverted perpetual forced withdraw.',
    render: notFound,
  },
  {
    path: '/dev/forced/perpetual/withdraw/included',
    description: 'Transaction view of an included perpetual forced withdraw.',
    breakAfter: true,
    render: notFound,
  },
  // #endregion
  // #region View perpetual trade
  {
    path: '/dev/forced/perpetual/trade/created',
    description: 'Offer view of a created perpetual forced trade.',
    render: notFound,
  },
  {
    path: '/dev/forced/perpetual/trade/accepted',
    description: 'Offer view of an accepted perpetual forced trade.',
    render: notFound,
  },
  {
    path: '/dev/forced/perpetual/trade/cancelled',
    description: 'Offer view of a cancelled perpetual forced trade.',
    render: notFound,
  },
  {
    path: '/dev/forced/perpetual/trade/expired',
    description: 'Offer view of an expired perpetual forced trade.',
    render: notFound,
  },
  {
    path: '/dev/forced/perpetual/trade/sent',
    description: 'Transaction view of a sent perpetual forced trade.',
    render: notFound,
  },
  {
    path: '/dev/forced/perpetual/trade/mined',
    description: 'Transaction view of a mined perpetual forced trade.',
    render: notFound,
  },
  {
    path: '/dev/forced/perpetual/trade/reverted',
    description: 'Transaction view of a reverted perpetual forced trade.',
    render: notFound,
  },
  {
    path: '/dev/forced/perpetual/trade/included',
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
  const account = getAccount(ctx)
  ctx.body = renderNotFoundPage({ account })
}

function getAccount(ctx: Koa.Context) {
  const cookie = ctx.cookies.get('account')
  if (cookie) {
    try {
      return {
        address: EthereumAddress(cookie),
        positionId: 123n,
        hasUpdates: Math.random() < 0.5,
      }
    } catch {
      return
    }
  }
}
