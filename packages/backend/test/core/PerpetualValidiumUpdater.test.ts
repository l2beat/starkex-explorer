import { MerkleTree, PositionLeaf } from '@explorer/state'
import { expect } from 'earljs'

import {
  EMPTY_STATE_HASH,
  PerpetualValidiumUpdater,
} from '../../src/core/PerpetualValidiumUpdater'
import type { MerkleTreeRepository } from '../../src/peripherals/database/MerkleTreeRepository'
import { mock } from '../mock'

describe(PerpetualValidiumUpdater.name, () => {
  it('has empty state hash correcly calculated', async () => {
    const rollupStateRepository = mock<MerkleTreeRepository<PositionLeaf>>({
      persist: async () => {},
    })
    const emptyTree = await MerkleTree.create(
      rollupStateRepository,
      64n,
      PositionLeaf.EMPTY
    )
    const emptyHash = await emptyTree.hash()
    expect(emptyHash.toString()).toEqual(EMPTY_STATE_HASH.toString())
  })

  describe(
    PerpetualValidiumUpdater.prototype.processValidiumStateTransition.name,
    () => {
      // TODO: add tests
    }
  )
})
