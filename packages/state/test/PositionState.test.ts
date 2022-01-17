import { PedersenHash } from '@explorer/crypto'
import { expect } from 'earljs'

import { PositionState } from '../src/PositionState'

describe(PositionState.name, () => {
  it('has a correct empty hash', async () => {
    const position = PositionState.EMPTY
    const hash = await position.hash()
    expect(hash).toEqual(
      PedersenHash(
        '28109b4e56fad0455aa4b316045c93937b1e7e4e0fc663db375b9e67c80c620'
      )
    )
  })

  it('has a correct hash with 1 asset', async () => {
    const position = new PositionState(`0x${'0'.repeat(63)}1`, 2n, [
      { assetId: 'BTC-10', balance: 3n, fundingIndex: 4n },
    ])
    const hash = await position.hash()
    expect(hash).toEqual(
      PedersenHash(
        '221150d3ed66e22364cfcaa34e69e2d6bc11ee0c0b90ab0b64e511b71eef16d'
      )
    )
  })

  it('has a correct hash with 2 assets', async () => {
    const position = new PositionState(`0x${'0'.repeat(63)}1`, 2n, [
      { assetId: 'ETH-9', balance: 3n, fundingIndex: 4n },
      { assetId: 'BTC-10', balance: 5n, fundingIndex: 6n },
    ])
    const hash = await position.hash()
    expect(hash).toEqual(
      PedersenHash(
        '421f86905759640afc3e73a02b5cd26088be2d3e84995f4ff4b950ca0487cca'
      )
    )
  })
})
