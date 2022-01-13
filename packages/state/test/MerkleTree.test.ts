import { PedersenHash, terminateWorkerPool } from '@explorer/crypto'
import { expect } from 'chai'

import { InMemoryMerkleStorage } from '../src/InMemoryMerkleStorage'
import { MerkleTree } from '../src/MerkleTree'
import { PositionState } from '../src/PositionState'

describe(MerkleTree.name, () => {
  it('can create a tree of height 0', async () => {
    const storage = new InMemoryMerkleStorage()
    const tree = MerkleTree.create(storage, 0n, PositionState.EMPTY)
    expect(await tree.hash()).to.equal(await PositionState.EMPTY.hash())
  })

  it('can create a tree of height 64', async () => {
    const storage = new InMemoryMerkleStorage()
    const tree = MerkleTree.create(storage, 64n, PositionState.EMPTY)
    expect(await tree.hash()).to.equal(
      PedersenHash(
        '52ddcbdd431a044cf838a71d194248640210b316d7b1a568997ecad9dec9626'
      )
    )
  })

  describe(MerkleTree.prototype.get.name, () => {
    it('returns the node at a specified index', async () => {
      const storage = new InMemoryMerkleStorage()
      const tree = MerkleTree.create(storage, 3n, PositionState.EMPTY)
      expect(await tree.get(2n)).to.equal(PositionState.EMPTY)
    })

    it('throws for negative indices', async () => {
      const storage = new InMemoryMerkleStorage()
      const tree = MerkleTree.create(storage, 3n, PositionState.EMPTY)
      await expect(tree.get(-1n)).to.be.rejectedWith(
        TypeError,
        'Index out of bounds'
      )
    })

    it('throws for too large indices', async () => {
      const storage = new InMemoryMerkleStorage()
      const tree = MerkleTree.create(storage, 3n, PositionState.EMPTY)
      await expect(tree.get(8n)).to.be.rejectedWith(
        TypeError,
        'Index out of bounds'
      )
    })
  })

  after(terminateWorkerPool)
})
