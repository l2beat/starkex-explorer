import { PedersenHash } from '@explorer/crypto'
import {
  HomeProps,
  renderHomePage,
  renderStateChangeDetailsPage,
} from '@explorer/frontend'
import Router from '@koa/router'

import { StateUpdateRepository } from '../../peripherals/database/StateUpdateRepository'

export function createFrontendRouter(
  stateUpdateRepository: StateUpdateRepository
) {
  const router = new Router()

  router.get('/', async (ctx) => {
    const stateUpdates = await stateUpdateRepository.getStateChangeList({
      offset: 0,
      limit: 20,
    })

    ctx.body = renderHomePage({
      forcedTransaction: [],
      stateUpdates: stateUpdates.map(
        (x): HomeProps['stateUpdates'][number] => ({
          hash: x.rootHash,
          timestamp: x.timestamp,
          positionCount: x.positionCount,
        })
      ),
    })
  })

  return router
}
