import { PedersenHash } from '@explorer/types'
import { expect } from 'earljs'

import { VaultLeaf } from '../src'
import { InMemoryMerkleStorage } from '../src/InMemoryMerkleStorage'
import { SpotState } from '../src/SpotState'

describe(SpotState.name, () => {
  describe(SpotState.empty.name, () => {
    it('has a specific root hash', async () => {
      const storage = new InMemoryMerkleStorage<VaultLeaf>()
      const empty = await SpotState.empty(storage, 31n)
      expect(await empty.positionTree.hash()).toEqual(
        PedersenHash(
          '0075364111a7a336756626d19fc8ec8df6328a5e63681c68ffaa312f6bf98c5c'
        )
      )
    })
  })
})
