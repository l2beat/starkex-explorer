import { PedersenHash } from '@explorer/crypto'
import {
  HomeProps,
  renderHomePage,
  renderStateChangeDetailsPage,
  renderPositionDetailsPage,
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

  router.get('/state-updates/:hash', async (ctx) => {
    const hash = PedersenHash(ctx.params.hash)
    const stateChange = await stateUpdateRepository.getStateChangeByRootHash(
      hash
    )

    ctx.body = renderStateChangeDetailsPage({
      hash,
      timestamp: stateChange.timestamp,
      positions: stateChange.positions,
    })
  })

  router.get('/positions/:positionId', async (ctx) => {
    const positionId = BigInt(ctx.params.positionId)
    const history = await stateUpdateRepository.getPositionById(positionId)

    ctx.body = renderPositionDetailsPage({
      positionId,
      history,
    })
  })

  return router
}
