import { AssetId, PedersenHash, StarkKey } from '@explorer/types'
import { expect } from 'earl'

import { PositionLeaf } from './PositionLeaf'

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

  it('generates a correct merkle proof prefix', async () => {
    const positionLeaf = new PositionLeaf(StarkKey('1'.padStart(64, '0')), 2n, [
      { assetId: AssetId('ETH-9'), balance: 3n, fundingIndex: 4n },
      { assetId: AssetId('BTC-10'), balance: 5n, fundingIndex: 6n },
    ])
    const prefix = await positionLeaf.calculateMerkleProofPrefix()
    expect(prefix).toEqual({
      nodes: [
        {
          left: PedersenHash(
            '0000000000000000000000000000000000000000000000000000000000000000'
          ),
          right: PedersenHash(
            '004254432d313000000000000000000080000000000000068000000000000005'
          ),
        },
        {
          left: PedersenHash(
            '06c0bf9095630b9a069f8a900041bcc8f203efa205a071986be886eff8ce37ae'
          ),
          right: PedersenHash(
            '004554482d390000000000000000000080000000000000048000000000000003'
          ),
        },
        {
          left: PedersenHash(
            '000f40cc2e96cd0736454e8ca77af2820d32ae616e437856c69e63de51db741e'
          ),
          right: PedersenHash(
            '0000000000000000000000000000000000000000000000000000000000000001'
          ),
        },
        {
          left: PedersenHash(
            '02920643dc741ff4912532d9e420ebd8ebf8e11ae643d67631a33740d0b50274'
          ),
          right: PedersenHash(
            '0000000000000000000000000000000000000000000080000000000000020002'
          ),
        },
      ],
      finalHash: PedersenHash(
        '421f86905759640afc3e73a02b5cd26088be2d3e84995f4ff4b950ca0487cca'
      ),
    })
  })
})
