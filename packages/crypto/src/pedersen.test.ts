import { PedersenHash } from '@explorer/types'
import { expect } from 'earljs'

import { pedersen, terminateWorkerPool } from './pedersen'

describe(pedersen.name, () => {
  it('hashes values asynchronously', async () => {
    const result = await pedersen(
      PedersenHash(
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      ),
      PedersenHash(
        'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
      )
    )
    expect(result).toEqual(
      PedersenHash(
        '1235ac944ab0709debd2756fc26deddd25741d0fca5c5acefdbd49b74c68af'
      )
    )
  })

  after(terminateWorkerPool)
})
