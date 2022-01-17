import { PedersenHash } from '@explorer/crypto'
import { expect } from 'earljs'

import { InMemoryMerkleStorage } from '../src/InMemoryMerkleStorage'
import { MerkleTree } from '../src/MerkleTree'
import { MerkleValue } from '../src/MerkleValue'
import { PositionState } from '../src/PositionState'

describe(MerkleTree.name, () => {
  describe(MerkleTree.create.name, () => {
    it('can create a tree of height 0', async () => {
      const storage = new InMemoryMerkleStorage()
      const tree = await MerkleTree.create(storage, 0n, PositionState.EMPTY)
      expect(await tree.hash()).toEqual(await PositionState.EMPTY.hash())
    })

    it('can create a tree of height 64', async () => {
      const storage = new InMemoryMerkleStorage()
      const tree = await MerkleTree.create(storage, 64n, PositionState.EMPTY)
      expect(await tree.hash()).toEqual(
        PedersenHash(
          '52ddcbdd431a044cf838a71d194248640210b316d7b1a568997ecad9dec9626'
        )
      )
    })

    it('persists nodes to the database', async () => {
      let persisted: MerkleValue[] = []
      const storage = new InMemoryMerkleStorage()
      storage.persist = async (values) => {
        persisted = values
      }
      const tree = await MerkleTree.create(storage, 2n, PositionState.EMPTY)
      expect(persisted).toEqual([
        await tree.getNode([0, 0]),
        await tree.getNode([0]),
        await tree.getNode([]),
      ])
    })
  })

  describe(MerkleTree.prototype.get.name, () => {
    it('returns the node at a specified index', async () => {
      const storage = new InMemoryMerkleStorage()
      const tree = await MerkleTree.create(storage, 3n, PositionState.EMPTY)
      expect(await tree.get(2n)).toEqual(PositionState.EMPTY)
    })

    it('throws for negative indices', async () => {
      const storage = new InMemoryMerkleStorage()
      const tree = await MerkleTree.create(storage, 3n, PositionState.EMPTY)
      await expect(tree.get(-1n)).toBeRejected(TypeError, 'Index out of bounds')
    })

    it('throws for too large indices', async () => {
      const storage = new InMemoryMerkleStorage()
      const tree = await MerkleTree.create(storage, 3n, PositionState.EMPTY)
      await expect(tree.get(8n)).toBeRejected(TypeError, 'Index out of bounds')
    })
  })

  describe(MerkleTree.prototype.update.name, () => {
    const positionA = new PositionState('0xdead1234', 420n, [])
    const positionB = new PositionState('0xbeef5678', 69n, [])

    it('updates nodes at specified indices', async () => {
      const storage = new InMemoryMerkleStorage()
      const tree = await MerkleTree.create(storage, 3n, PositionState.EMPTY)

      expect(await tree.get(2n)).toEqual(PositionState.EMPTY)
      expect(await tree.get(7n)).toEqual(PositionState.EMPTY)

      await tree.update([
        { index: 2n, value: positionA },
        { index: 7n, value: positionB },
      ])

      expect(await tree.get(2n)).toEqual(positionA)
      expect(await tree.get(7n)).toEqual(positionB)
    })

    it('throws for negative indices', async () => {
      const storage = new InMemoryMerkleStorage()
      const tree = await MerkleTree.create(storage, 3n, PositionState.EMPTY)

      await expect(
        tree.update([
          { index: -1n, value: positionA },
          { index: 7n, value: positionB },
        ])
      ).toBeRejected(TypeError, 'Index out of bounds')
    })

    it('throws for too large indices', async () => {
      const storage = new InMemoryMerkleStorage()
      const tree = await MerkleTree.create(storage, 3n, PositionState.EMPTY)

      await expect(
        tree.update([
          { index: 2n, value: positionA },
          { index: 8n, value: positionB },
        ])
      ).toBeRejected(TypeError, 'Index out of bounds')
    })

    it('throws for too large indices', async () => {
      const storage = new InMemoryMerkleStorage()
      const tree = await MerkleTree.create(storage, 3n, PositionState.EMPTY)

      await expect(
        tree.update([
          { index: 2n, value: positionA },
          { index: 8n, value: positionB },
        ])
      ).toBeRejected(TypeError, 'Index out of bounds')
    })

    it('uses last value for multiple updates at the same index', async () => {
      const storage = new InMemoryMerkleStorage()
      const tree = await MerkleTree.create(storage, 3n, PositionState.EMPTY)

      expect(await tree.get(2n)).toEqual(PositionState.EMPTY)
      await tree.update([
        { index: 2n, value: positionA },
        { index: 2n, value: positionB },
      ])
      expect(await tree.get(2n)).toEqual(positionB)
    })

    it('empty update array leaves the hash unchanged', async () => {
      const storage = new InMemoryMerkleStorage()
      const tree = await MerkleTree.create(storage, 3n, PositionState.EMPTY)

      const hashBefore = await tree.hash()
      await tree.update([])
      const hashAfter = await tree.hash()
      expect(hashBefore).toEqual(hashAfter)
    })

    it('non-empty update changes the hash', async () => {
      const storage = new InMemoryMerkleStorage()
      const tree = await MerkleTree.create(storage, 3n, PositionState.EMPTY)

      const hashBefore = await tree.hash()
      await tree.update([
        { index: 2n, value: positionA },
        { index: 7n, value: positionB },
      ])
      const hashAfter = await tree.hash()
      expect(hashBefore).not.toEqual(hashAfter)
    })

    it('updates that do not change values do not change the hash', async () => {
      const storage = new InMemoryMerkleStorage()
      const tree = await MerkleTree.create(storage, 3n, PositionState.EMPTY)

      const hashBefore = await tree.hash()
      await tree.update([{ index: 2n, value: PositionState.EMPTY }])
      const hashAfter = await tree.hash()
      expect(hashBefore).toEqual(hashAfter)
    })

    it('has a correct hash after updates', async () => {
      const storage = new InMemoryMerkleStorage()
      const tree = await MerkleTree.create(storage, 3n, PositionState.EMPTY)

      const positionA = new PositionState(`0x${'0'.repeat(63)}1`, 2n, [
        { assetId: 'BTC-10', balance: 3n, fundingIndex: 4n },
      ])
      const positionB = new PositionState(`0x${'0'.repeat(63)}1`, 2n, [
        { assetId: 'ETH-9', balance: 3n, fundingIndex: 4n },
        { assetId: 'BTC-10', balance: 5n, fundingIndex: 6n },
      ])

      await tree.update([
        { index: 2n, value: positionA },
        { index: 7n, value: positionB },
      ])

      expect(await tree.hash()).toEqual(
        PedersenHash(
          '07b56631b126137c5e21afb5b9bc187d3cce0c549dfbbf58abdd6b00a3b3527a'
        )
      )
    })

    it('persists updated nodes to the database', async () => {
      const storage = new InMemoryMerkleStorage()
      const tree = await MerkleTree.create(storage, 3n, PositionState.EMPTY)

      let persisted: MerkleValue[] = []
      storage.persist = async (values) => {
        persisted = values
      }

      await tree.update([
        { index: 2n, value: positionA },
        { index: 7n, value: positionB },
      ])

      expect(persisted).toEqual([
        await tree.getNode([0, 1, 0]),
        await tree.getNode([0, 1]),
        await tree.getNode([0]),
        await tree.getNode([1, 1, 1]),
        await tree.getNode([1, 1]),
        await tree.getNode([1]),
        await tree.getNode([]),
      ])
    })
  })

  describe('recovering nodes', () => {
    const positionA = new PositionState('0xdead1234', 420n, [])
    const positionB = new PositionState('0xbeef5678', 69n, [])

    it('can recover a persisted state', async () => {
      const storage = new InMemoryMerkleStorage()
      const tree = await MerkleTree.create(storage, 3n, PositionState.EMPTY)
      await tree.update([
        { index: 2n, value: positionA },
        { index: 7n, value: positionB },
      ])

      const recovered = new MerkleTree(storage, 3n, await tree.hash())
      expect(await recovered.get(2n)).toEqual(positionA)
    })

    it('set hash changes the tree', async () => {
      const storage = new InMemoryMerkleStorage()
      const treeA = await MerkleTree.create(storage, 3n, PositionState.EMPTY)
      const treeB = new MerkleTree(storage, 3n, await treeA.hash())

      await treeA.update([
        { index: 2n, value: positionA },
        { index: 7n, value: positionB },
      ])

      expect(await treeB.get(2n)).toEqual(PositionState.EMPTY)
      treeB.setHash(await treeA.hash())
      expect(await treeB.get(2n)).toEqual(positionA)
    })
  })
})
