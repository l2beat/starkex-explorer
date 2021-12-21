import { terminateWorkerPool } from '@explorer/crypto'
import { expect } from 'chai'

import { VaultLeaf } from '../src/VaultLeaf'

describe('VaultLeaf', () => {
  it('has a correct empty hash', async () => {
    const vault = VaultLeaf.EMPTY
    const hash = await vault.hash()
    expect(hash).to.equal(
      '6bf1b215edde951b1b50c19e77f7b362d23c6cb4232ae8b95bc112ff94d3956'
    )
  })

  it('has a correct hash with values', async () => {
    const vault = new VaultLeaf('1', '2', 3n)
    const hash = await vault.hash()
    expect(hash).to.equal(
      '5cdd7ef6b0b1cf28fba033a8369dec45d1d94101c0550ac8a26bd8133695e07'
    )
  })

  it('can be initialized with a hash', async () => {
    const vault = new VaultLeaf('0', '0', 0n, 'f00ba3')
    const hash = await vault.hash()
    expect(hash).to.equal('f00ba3')
  })

  after(terminateWorkerPool)
})
