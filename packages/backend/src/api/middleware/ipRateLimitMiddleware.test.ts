import { expect, mockFn } from 'earl'
import { Context, Next } from 'koa'

import { createIpRateLimitMiddleware } from './ipRateLimitMiddleware'

describe(createIpRateLimitMiddleware.name, () => {
  describe('GET requests', () => {
    it('returns 429 after exceeding the configured limit', async () => {
      const now = () => 0
      const middleware = createIpRateLimitMiddleware({
        requestsPerMinute: 2,
        now,
      })
      const ctx = createContext()
      const next = mockFn<Next>(async () => undefined)

      await middleware(ctx, next)
      await middleware(ctx, next)
      await middleware(ctx, next)

      expect(next).toHaveBeenCalledTimes(2)
      expect(ctx.status).toEqual(429)
      expect(ctx.body).toEqual(
        'Too many requests. Please try again in about a minute.'
      )
      expect(ctx.headers.get('Retry-After')).toEqual('60')
    })

    it('allows requests again after a new minute starts', async () => {
      let currentTime = 0
      const middleware = createIpRateLimitMiddleware({
        requestsPerMinute: 1,
        now: () => currentTime,
      })
      const ctx = createContext()
      let nextCalls = 0
      const next: Next = async () => {
        nextCalls += 1
      }

      await middleware(ctx, next)
      await middleware(ctx, next)

      currentTime = 60_000

      await middleware(ctx, next)

      expect(nextCalls).toEqual(2)
    })
  })

  it('does not limit non-GET requests', async () => {
    const middleware = createIpRateLimitMiddleware({
      requestsPerMinute: 1,
      now: () => 0,
    })
    const ctx = createContext({ method: 'POST' })
    let nextCalls = 0
    const next: Next = async () => {
      nextCalls += 1
    }

    await middleware(ctx, next)
    await middleware(ctx, next)
    await middleware(ctx, next)

    expect(nextCalls).toEqual(3)
    expect(ctx.status).not.toEqual(429)
  })

  it('does not limit /status checks', async () => {
    const middleware = createIpRateLimitMiddleware({
      requestsPerMinute: 1,
      now: () => 0,
    })
    const ctx = createContext({ path: '/status' })
    let nextCalls = 0
    const next: Next = async () => {
      nextCalls += 1
    }

    await middleware(ctx, next)
    await middleware(ctx, next)
    await middleware(ctx, next)

    expect(nextCalls).toEqual(3)
  })

  it('isolates limits per IP', async () => {
    const middleware = createIpRateLimitMiddleware({
      requestsPerMinute: 1,
      now: () => 0,
    })

    const firstIpContext = createContext({ ip: '203.0.113.1' })
    const secondIpContext = createContext({ ip: '203.0.113.2' })
    let nextCalls = 0
    const next: Next = async () => {
      nextCalls += 1
    }

    await middleware(firstIpContext, next)
    await middleware(firstIpContext, next)
    await middleware(secondIpContext, next)

    expect(firstIpContext.status).toEqual(429)
    expect(secondIpContext.status).not.toEqual(429)
    expect(nextCalls).toEqual(2)
  })
})

function createContext({
  method = 'GET',
  path = '/users/0x123/balance-changes',
  ip = '203.0.113.1',
}: {
  method?: string
  path?: string
  ip?: string
} = {}) {
  const headers = new Map<string, string>()
  const ctx = {
    method,
    path,
    ip,
    headers,
    set(name: string, value: string) {
      headers.set(name, value)
    },
  } as unknown as Context & {
    headers: Map<string, string>
  }

  return ctx
}
