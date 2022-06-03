import Router from '@koa/router'
import { Middleware } from 'koa'
import { agent } from 'supertest'

import { ApiServer } from '../../src/api/ApiServer'
import { Logger } from '../../src/tools/Logger'

export function createTestApiServer(
  routers: Router[],
  middleware?: Middleware[]
) {
  const callback = new ApiServer(0, Logger.SILENT, {
    routers,
    middleware,
    forceHttps: false,
  }).getNodeCallback()
  return agent(callback)
}
