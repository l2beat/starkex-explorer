import { expect } from 'chai'

import { terminateWorkerPool, pedersen } from '../src/pedersen'

describe('pedersen', () => {
  it('hashes values asynchronously', async () => {
    const result = await pedersen(
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
    )
    expect(result).to.equal(
      '1235ac944ab0709debd2756fc26deddd25741d0fca5c5acefdbd49b74c68af'
    )
  })

  async function getExecutionTime(fn: () => Promise<unknown>) {
    const start = Date.now()
    await fn()
    return Date.now() - start
  }

  it('hashes values in parallel', async () => {
    async function hash() {
      return pedersen(
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
      )
    }

    async function hashMany(n: number) {
      return Promise.all(new Array(n).fill(0).map(hash))
    }

    // initialize
    await hashMany(10)

    const shortTime = await getExecutionTime(() => hashMany(1))
    const longTime = await getExecutionTime(() => hashMany(10))
    expect(longTime).to.be.lessThan(shortTime * 4)
  })

  after(terminateWorkerPool)
})
