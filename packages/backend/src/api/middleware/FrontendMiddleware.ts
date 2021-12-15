import serve from 'koa-static'
import path from 'path'

export function createFrontendMiddleware() {
  const staticPath = path.join(
    path.dirname(require.resolve('@explorer/frontend/package.json')),
    'build/static'
  )
  return serve(staticPath, {
    maxAge: 365 * 24 * 60 * 60 * 1000,
    immutable: true,
  })
}
