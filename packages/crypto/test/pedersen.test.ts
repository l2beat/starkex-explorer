import { expect } from 'earljs'

import { pedersen, terminateWorkerPool } from '../src/pedersen'

describe('pedersen', () => {
  it('hashes values asynchronously', async () => {
    const result = await pedersen(
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
    )
    expect(result).toEqual(
      '1235ac944ab0709debd2756fc26deddd25741d0fca5c5acefdbd49b74c68af'
    )
  })

  after(terminateWorkerPool)
})
