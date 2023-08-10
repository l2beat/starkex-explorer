import { AssetHash, PedersenHash, StarkKey } from '@explorer/types'
import { expect } from 'earl'

import { VaultLeaf } from './VaultLeaf'

const tokenA = AssetHash(
  '0xd5b742d29ab21fdb06ac5c7c460550131c0b30cbc4c911985174c0ea4a92ec'
)

describe(VaultLeaf.name, () => {
  it('has a correct empty hash', async () => {
    const vaultLeaf = VaultLeaf.EMPTY
    const hash = await vaultLeaf.hash()
    expect(hash).toEqual(
      PedersenHash(
        '06bf1b215edde951b1b50c19e77f7b362d23c6cb4232ae8b95bc112ff94d3956'
      )
    )
  })

  it('has a correct hash', async () => {
    const vaultLeaf = new VaultLeaf(
      StarkKey('1'.padStart(64, '0')),
      12345n,
      tokenA
    )
    const hash = await vaultLeaf.hash()
    expect(hash).toEqual(
      PedersenHash(
        '06741c94e703af77f8fd22669d1a819074c19e6e2e4b41967db707e180c96865'
      )
    )
  })

  it('generates a correct merkle proof prefix', async () => {
    const vaultLeaf = new VaultLeaf(StarkKey.fake('beef'), 12345n, tokenA)
    const hash = await vaultLeaf.calculateMerkleProofPrefix()
    expect(hash).toEqual({
      nodes: [
        {
          left: PedersenHash(
            '0beef00000000000000000000000000000000000000000000000000000000000'
          ),
          right: PedersenHash(
            '00d5b742d29ab21fdb06ac5c7c460550131c0b30cbc4c911985174c0ea4a92ec'
          ),
        },
        {
          left: PedersenHash(
            '023d412f1f9c1a4a45fb25d3dc489132d493465d1e93c7c5f068e2b51e84360f'
          ),
          right: PedersenHash(
            '0000000000000000000000000000000000000000000000000000000000003039'
          ),
        },
      ],
      finalHash: PedersenHash(
        '0726343459570e12da59aa8ac0270bdce02f185e5bb2dce9110824f6bdbb8e83'
      ),
    })
  })

  it('can be stringified to json and back', async () => {
    const vaultLeaf = new VaultLeaf(
      StarkKey('1'.padStart(64, '0')),
      12345n,
      tokenA
    )
    const json = vaultLeaf.toJSON()
    const transformed = JSON.parse(JSON.stringify(json))
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const recovered = VaultLeaf.fromJSON(transformed)
    expect(recovered).toEqual(vaultLeaf)
  })
})
