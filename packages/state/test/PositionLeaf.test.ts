import { AssetId, PedersenHash, StarkKey } from '@explorer/types'
import { expect } from 'earljs'

import { PositionLeaf } from '../src/PositionLeaf'

describe(PositionLeaf.name, () => {
  it('has a correct empty hash', async () => {
    const positionLeaf = PositionLeaf.EMPTY
    const hash = await positionLeaf.hash()
    expect(hash).toEqual(
      PedersenHash(
        '28109b4e56fad0455aa4b316045c93937b1e7e4e0fc663db375b9e67c80c620'
      )
    )
  })

  it('has a correct hash with 1 asset', async () => {
    const positionLeaf = new PositionLeaf(StarkKey('1'.padStart(64, '0')), 2n, [
      { assetId: AssetId('BTC-10'), balance: 3n, fundingIndex: 4n },
    ])
    const hash = await positionLeaf.hash()
    expect(hash).toEqual(
      PedersenHash(
        '221150d3ed66e22364cfcaa34e69e2d6bc11ee0c0b90ab0b64e511b71eef16d'
      )
    )
  })

  it('has a correct hash with 2 assets', async () => {
    const positionLeaf = new PositionLeaf(StarkKey('1'.padStart(64, '0')), 2n, [
      { assetId: AssetId('ETH-9'), balance: 3n, fundingIndex: 4n },
      { assetId: AssetId('BTC-10'), balance: 5n, fundingIndex: 6n },
    ])
    const hash = await positionLeaf.hash()
    expect(hash).toEqual(
      PedersenHash(
        '421f86905759640afc3e73a02b5cd26088be2d3e84995f4ff4b950ca0487cca'
      )
    )
  })

  it('can be stringified to json and back', async () => {
    const positionLeaf = new PositionLeaf(StarkKey('1'.padStart(64, '0')), 2n, [
      { assetId: AssetId('ETH-9'), balance: 3n, fundingIndex: 4n },
      { assetId: AssetId('BTC-10'), balance: 5n, fundingIndex: 6n },
    ])
    const json = positionLeaf.toJSON()
    const transformed = JSON.parse(JSON.stringify(json))
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const recovered = PositionLeaf.fromJSON(transformed)
    expect(recovered).toEqual(positionLeaf)
  })
})
