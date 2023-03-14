import { PedersenHash } from '@explorer/types'
import { expect } from 'earljs'

import { pedersen, terminateWorkerPool } from './pedersen'

describe(pedersen.name, () => {
  it('hashes values asynchronously', async () => {
    const result = await pedersen(
      PedersenHash(
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      ),
      PedersenHash(
        'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
      )
    )
    expect(result).toEqual(
      PedersenHash(
        '059fa7bb82f5f1a8d8f03f06fbf1f2829548f2d87b6d2e5a8f2cf4e6cb4b53da'
      )
    )
  })

  after(terminateWorkerPool)
})
