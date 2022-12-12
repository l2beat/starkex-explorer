import { PedersenHash, StarkKey } from '@explorer/types'
import { expect } from 'earljs'

import { VaultLeaf } from '../src/VaultLeaf'

const tokenA = PedersenHash(
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
