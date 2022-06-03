import { Context, Next } from 'koa'

export function forceHerokuHttps(ctx: Context, next: Next) {
  // https://help.heroku.com/J2R1S4T8/can-heroku-force-an-application-to-use-ssl-tls
  if (ctx.headers['x-forwarded-proto'] === 'https') {
    return next()
  }
  const url = ctx.request.URL
  url.protocol = 'https'
  ctx.response.status = 301
  ctx.response.redirect(url.href)
}
