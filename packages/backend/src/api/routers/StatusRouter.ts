import Router from '@koa/router'

import type { StatusService } from '../../core/StatusService'

export function createStatusRouter(statusService: StatusService) {
  const router = new Router()

  router.get('/status', (ctx) => {
    ctx.body = statusService.getStatus()
  })

  for (const reporter of statusService.getReporters()) {
    router.get(`/status/${reporter}`, (ctx) => {
      ctx.body = statusService.getReporterStatus(reporter)
    })
  }

  return router
}
