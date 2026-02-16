import { Context, Middleware } from 'koa'

const ONE_MINUTE_MS = 60_000
const CLEANUP_INTERVAL = 256

interface IpBucket {
  window: number
  requests: number
}

interface Options {
  requestsPerMinute: number
  now?: () => number
}

export function createIpRateLimitMiddleware(options: Options): Middleware {
  const requestsPerMinute = Math.floor(options.requestsPerMinute)
  const now = options.now ?? (() => Date.now())
  const buckets = new Map<string, IpBucket>()
  let requestsSinceCleanup = 0

  if (requestsPerMinute <= 0) {
    return async (_ctx, next) => {
      await next()
    }
  }

  return async (ctx, next) => {
    if (!shouldRateLimit(ctx)) {
      await next()
      return
    }

    const currentTime = now()
    const currentWindow = Math.floor(currentTime / ONE_MINUTE_MS)
    const ip = ctx.ip
    const bucket = buckets.get(ip)

    if (bucket && bucket.window === currentWindow) {
      bucket.requests += 1
    } else {
      buckets.set(ip, {
        window: currentWindow,
        requests: 1,
      })
    }

    cleanupExpiredBuckets(currentWindow)

    const requests = buckets.get(ip)?.requests ?? 0
    if (requests > requestsPerMinute) {
      const nextWindowStart = (currentWindow + 1) * ONE_MINUTE_MS
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((nextWindowStart - currentTime) / 1000)
      )

      ctx.set('Retry-After', retryAfterSeconds.toString())
      ctx.status = 429
      ctx.body = 'Too many requests. Please try again in about a minute.'
      return
    }

    await next()
  }

  function cleanupExpiredBuckets(currentWindow: number) {
    requestsSinceCleanup += 1

    if (requestsSinceCleanup < CLEANUP_INTERVAL) {
      return
    }
    requestsSinceCleanup = 0

    for (const [bucketIp, bucket] of buckets.entries()) {
      if (bucket.window < currentWindow) {
        buckets.delete(bucketIp)
      }
    }
  }
}

function shouldRateLimit(ctx: Context): boolean {
  if (ctx.method !== 'GET') {
    return false
  }

  return !isStatusPath(ctx.path)
}

function isStatusPath(path: string): boolean {
  return path === '/status' || path.startsWith('/status/')
}
