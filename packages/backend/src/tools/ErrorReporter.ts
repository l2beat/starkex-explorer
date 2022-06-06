import * as Sentry from '@sentry/node'
import { Context } from 'koa'

const dsn = process.env.SENTRY_DSN

if (dsn) {
  Sentry.init({ dsn })
}

export function reportError(error: unknown): void {
  if (!dsn) return
  Sentry.captureException(error)
}

export function handleServerError(err: Error, ctx: Context) {
  if (!dsn) return
  Sentry.withScope((scope) => {
    scope.addEventProcessor((event) => {
      return Sentry.Handlers.parseRequest(event, ctx.request)
    })
    Sentry.captureException(err)
  })
}
