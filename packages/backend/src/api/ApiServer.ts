import Router from '@koa/router'
import { Logger } from '@l2beat/backend-tools'
import Koa, { Context, Middleware } from 'koa'

import { createApiLogger } from './ApiLogger'
import { forceHerokuHttps } from './middleware/forceHttps'

interface Options {
  routers?: Router[]
  middleware?: Middleware[]
  forceHttps: boolean
  handleServerError?: (error: Error, ctx: Context) => void
}

export class ApiServer {
  private app: Koa

  constructor(private port: number, private logger: Logger, options: Options) {
    this.logger = this.logger.for(this)
    this.app = new Koa()

    this.app.use(createApiLogger(this.logger))

    if (options.forceHttps) {
      this.app.proxy = true
      this.app.use(forceHerokuHttps)
    }

    for (const middleware of options.middleware ?? []) {
      this.app.use(middleware)
    }

    const router = new Router()

    for (const childRouter of options.routers ?? []) {
      router.use(childRouter.routes(), childRouter.allowedMethods())
    }

    this.app.use(router.routes())
    this.app.use(router.allowedMethods())

    if (options.handleServerError) {
      this.app.on('error', options.handleServerError)
    }
  }

  listen() {
    return new Promise<void>((resolve) => {
      this.app.listen(this.port, () => {
        this.logger.info({ message: 'Listening', port: this.port })
        resolve()
      })
    })
  }

  getNodeCallback() {
    return this.app.callback()
  }
}
