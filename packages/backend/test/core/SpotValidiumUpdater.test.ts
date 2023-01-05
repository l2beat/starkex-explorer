import { MerkleTree, VaultLeaf } from '@explorer/state'
import { expect } from 'earljs'

import {
  EMPTY_STATE_HASH,
  SpotValidiumUpdater,
} from '../../src/core/SpotValidiumUpdater'
import type { MerkleTreeRepository } from '../../src/peripherals/database/MerkleTreeRepository'
import { mock } from '../mock'

describe(SpotValidiumUpdater.name, () => {
  it('has empty state hash correcly calculated', async () => {
    const rollupStateRepository = mock<MerkleTreeRepository<VaultLeaf>>({
      persist: async () => {},
    })
    const emptyTree = await MerkleTree.create(
      rollupStateRepository,
      31n,
      VaultLeaf.EMPTY
    )
    const emptyHash = await emptyTree.hash()
    expect(emptyHash.toString()).toEqual(EMPTY_STATE_HASH.toString())
  })

  describe(
    SpotValidiumUpdater.prototype.processSpotValidiumStateTransition.name,
    () => {
      // TODO: add tests
    }
  )
})
