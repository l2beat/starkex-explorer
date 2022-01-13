import { expect } from 'chai'

import { PedersenHash } from '../src'
import { pedersen, terminateWorkerPool } from '../src/pedersen'

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
    expect(result).to.equal(
      PedersenHash(
        '1235ac944ab0709debd2756fc26deddd25741d0fca5c5acefdbd49b74c68af'
      )
    )
  })

  after(terminateWorkerPool)
})
