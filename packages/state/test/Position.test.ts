import { PedersenHash } from '@explorer/crypto'
import { AssetId } from '@explorer/types'
import { expect } from 'earljs'

import { Position } from '../src/Position'

describe(Position.name, () => {
  it('has a correct empty hash', async () => {
    const position = Position.EMPTY
    const hash = await position.hash()
    expect(hash).toEqual(
      PedersenHash(
        '28109b4e56fad0455aa4b316045c93937b1e7e4e0fc663db375b9e67c80c620'
      )
    )
  })

  it('has a correct hash with 1 asset', async () => {
    const position = new Position(`0x${'0'.repeat(63)}1`, 2n, [
      { assetId: AssetId('BTC-10'), balance: 3n, fundingIndex: 4n },
    ])
    const hash = await position.hash()
    expect(hash).toEqual(
      PedersenHash(
        '221150d3ed66e22364cfcaa34e69e2d6bc11ee0c0b90ab0b64e511b71eef16d'
      )
    )
  })

  it('has a correct hash with 2 assets', async () => {
    const position = new Position(`0x${'0'.repeat(63)}1`, 2n, [
      { assetId: AssetId('ETH-9'), balance: 3n, fundingIndex: 4n },
      { assetId: AssetId('BTC-10'), balance: 5n, fundingIndex: 6n },
    ])
    const hash = await position.hash()
    expect(hash).toEqual(
      PedersenHash(
        '421f86905759640afc3e73a02b5cd26088be2d3e84995f4ff4b950ca0487cca'
      )
    )
  })

  it('can be stringified to json and back', async () => {
    const position = new Position(`0x${'0'.repeat(63)}1`, 2n, [
      { assetId: AssetId('ETH-9'), balance: 3n, fundingIndex: 4n },
      { assetId: AssetId('BTC-10'), balance: 5n, fundingIndex: 6n },
    ])
    const json = position.toJSON()
    const transformed = JSON.parse(JSON.stringify(json))
    const recovered = Position.fromJSON(transformed)
    expect(recovered).toEqual(position)
  })
})
