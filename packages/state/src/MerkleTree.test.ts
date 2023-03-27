import { AssetId, PedersenHash, StarkKey } from '@explorer/types'
import { expect } from 'earljs'

import { InMemoryMerkleStorage } from './InMemoryMerkleStorage'
import { MerkleTree } from './MerkleTree'
import { MerkleValue } from './MerkleValue'
import { PositionLeaf } from './PositionLeaf'
import { VaultLeaf } from './VaultLeaf'

describe(MerkleTree.name, () => {
  describe(MerkleTree.create.name, () => {
    it('has a specific root hash for height 64 and position leaf', async function () {
      // calculating hashes is slow :(
      this.timeout(5000)

      const storage = new InMemoryMerkleStorage<PositionLeaf>()
      const empty = await MerkleTree.create(storage, 64n, PositionLeaf.EMPTY)
      expect(await empty.hash()).toEqual(
        PedersenHash(
          '052ddcbdd431a044cf838a71d194248640210b316d7b1a568997ecad9dec9626'
        )
      )
    })

    it('has a specific root hash', async function () {
      // calculating hashes is slow :(
      this.timeout(5000)

      const storage = new InMemoryMerkleStorage<VaultLeaf>()
      const empty = await MerkleTree.create(storage, 31n, VaultLeaf.EMPTY)
      expect(await empty.hash()).toEqual(
        PedersenHash(
          '0075364111a7a336756626d19fc8ec8df6328a5e63681c68ffaa312f6bf98c5c'
        )
      )
    })

    it('can create a tree of height 0', async () => {
      const storage = new InMemoryMerkleStorage()
      const tree = await MerkleTree.create(storage, 0n, PositionLeaf.EMPTY)
      expect(await tree.hash()).toEqual(await PositionLeaf.EMPTY.hash())
    })

    it('can create a tree of height 64', async function () {
      // calculating hashes is slow :(
      this.timeout(5000)

      const storage = new InMemoryMerkleStorage()
      const tree = await MerkleTree.create(storage, 64n, PositionLeaf.EMPTY)
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
      const tree = await MerkleTree.create(storage, 2n, PositionLeaf.EMPTY)
      expect(persisted).toEqual([
        await tree.getNode([0, 0]),
        await tree.getNode([0]),
        await tree.getNode([]),
      ])
    })
  })

  describe(MerkleTree.prototype.getLeaf.name, () => {
    it('returns the leaf at a specified index', async () => {
      const storage = new InMemoryMerkleStorage()
      const tree = await MerkleTree.create(storage, 3n, PositionLeaf.EMPTY)
      expect(await tree.getLeaf(2n)).toEqual(PositionLeaf.EMPTY)
    })

    it('throws for negative indices', async () => {
      const storage = new InMemoryMerkleStorage()
      const tree = await MerkleTree.create(storage, 3n, PositionLeaf.EMPTY)
      await expect(tree.getLeaf(-1n)).toBeRejectedWith(
        TypeError,
        'Index out of bounds'
      )
    })

    it('throws for too large indices', async () => {
      const storage = new InMemoryMerkleStorage()
      const tree = await MerkleTree.create(storage, 3n, PositionLeaf.EMPTY)
      await expect(tree.getLeaf(8n)).toBeRejectedWith(
        TypeError,
        'Index out of bounds'
      )
    })
  })

  describe(MerkleTree.prototype.getLeaves.name, () => {
    it('returns multiple leaves', async () => {
      const positionLeafA = new PositionLeaf(StarkKey.fake('dead'), 420n, [])
      const positionLeafB = new PositionLeaf(StarkKey.fake('beef'), 69n, [])

      const storage = new InMemoryMerkleStorage()
      let tree = await MerkleTree.create(storage, 3n, PositionLeaf.EMPTY)
      tree = await tree.update([
        { index: 2n, value: positionLeafA },
        { index: 7n, value: positionLeafB },
      ])

      expect(await tree.getLeaves([7n, 1n, 2n])).toEqual([
        positionLeafB,
        PositionLeaf.EMPTY,
        positionLeafA,
      ])
    })

    it('throws for negative indices', async () => {
      const storage = new InMemoryMerkleStorage()
      const tree = await MerkleTree.create(storage, 3n, PositionLeaf.EMPTY)
      await expect(tree.getLeaf(-1n)).toBeRejectedWith(
        TypeError,
        'Index out of bounds'
      )
    })

    it('throws for too large indices', async () => {
      const storage = new InMemoryMerkleStorage()
      const tree = await MerkleTree.create(storage, 3n, PositionLeaf.EMPTY)
      await expect(tree.getLeaf(8n)).toBeRejectedWith(
        TypeError,
        'Index out of bounds'
      )
    })
  })

  describe(MerkleTree.prototype.update.name, () => {
    const positionLeafA = new PositionLeaf(StarkKey.fake('dead'), 420n, [])
    const positionLeafB = new PositionLeaf(StarkKey.fake('beef'), 69n, [])

    it('updates nodes at specified indices', async () => {
      const storage = new InMemoryMerkleStorage()
      let tree = await MerkleTree.create(storage, 3n, PositionLeaf.EMPTY)

      expect(await tree.getLeaves([2n, 7n])).toEqual([
        PositionLeaf.EMPTY,
        PositionLeaf.EMPTY,
      ])

      tree = await tree.update([
        { index: 2n, value: positionLeafA },
        { index: 7n, value: positionLeafB },
      ])

      expect(await tree.getLeaves([2n, 7n])).toEqual([
        positionLeafA,
        positionLeafB,
      ])
    })

    it('does not change the original tree', async () => {
      const storage = new InMemoryMerkleStorage()
      const tree = await MerkleTree.create(storage, 3n, PositionLeaf.EMPTY)

      const hashBefore = await tree.hash()
      await tree.update([
        { index: 2n, value: positionLeafA },
        { index: 7n, value: positionLeafB },
      ])
      const hashAfter = await tree.hash()

      expect(hashBefore).toEqual(hashAfter)
    })

    it('throws for negative indices', async () => {
      const storage = new InMemoryMerkleStorage()
      const tree = await MerkleTree.create(storage, 3n, PositionLeaf.EMPTY)

      await expect(
        tree.update([
          { index: -1n, value: positionLeafA },
          { index: 7n, value: positionLeafB },
        ])
      ).toBeRejectedWith(TypeError, 'Index out of bounds')
    })

    it('throws for too large indices', async () => {
      const storage = new InMemoryMerkleStorage()
      const tree = await MerkleTree.create(storage, 3n, PositionLeaf.EMPTY)

      await expect(
        tree.update([
          { index: 2n, value: positionLeafA },
          { index: 8n, value: positionLeafB },
        ])
      ).toBeRejectedWith(TypeError, 'Index out of bounds')
    })

    it('throws for too large indices', async () => {
      const storage = new InMemoryMerkleStorage()
      const tree = await MerkleTree.create(storage, 3n, PositionLeaf.EMPTY)

      await expect(
        tree.update([
          { index: 2n, value: positionLeafA },
          { index: 8n, value: positionLeafB },
        ])
      ).toBeRejectedWith(TypeError, 'Index out of bounds')
    })

    it('uses last value for multiple updates at the same index', async () => {
      const storage = new InMemoryMerkleStorage()
      let tree = await MerkleTree.create(storage, 3n, PositionLeaf.EMPTY)

      expect(await tree.getLeaf(2n)).toEqual(PositionLeaf.EMPTY)
      tree = await tree.update([
        { index: 2n, value: positionLeafA },
        { index: 2n, value: positionLeafB },
      ])
      expect(await tree.getLeaf(2n)).toEqual(positionLeafB)
    })

    it('empty update array leaves the hash unchanged', async () => {
      const storage = new InMemoryMerkleStorage()
      let tree = await MerkleTree.create(storage, 3n, PositionLeaf.EMPTY)

      const hashBefore = await tree.hash()
      tree = await tree.update([])
      const hashAfter = await tree.hash()
      expect(hashBefore).toEqual(hashAfter)
    })

    it('non-empty update changes the hash', async () => {
      const storage = new InMemoryMerkleStorage()
      let tree = await MerkleTree.create(storage, 3n, PositionLeaf.EMPTY)

      const hashBefore = await tree.hash()
      tree = await tree.update([
        { index: 2n, value: positionLeafA },
        { index: 7n, value: positionLeafB },
      ])
      const hashAfter = await tree.hash()
      expect(hashBefore).not.toEqual(hashAfter)
    })

    it('updates that do not change values do not change the hash', async () => {
      const storage = new InMemoryMerkleStorage()
      let tree = await MerkleTree.create(storage, 3n, PositionLeaf.EMPTY)

      const hashBefore = await tree.hash()
      tree = await tree.update([{ index: 2n, value: PositionLeaf.EMPTY }])
      const hashAfter = await tree.hash()
      expect(hashBefore).toEqual(hashAfter)
    })

    it('has a correct hash after updates', async () => {
      const storage = new InMemoryMerkleStorage()
      let tree = await MerkleTree.create(storage, 3n, PositionLeaf.EMPTY)

      const positionLeafA = new PositionLeaf(
        StarkKey('1'.padStart(64, '0')),
        2n,
        [{ assetId: AssetId('BTC-10'), balance: 3n, fundingIndex: 4n }]
      )
      const positionLeafB = new PositionLeaf(
        StarkKey('1'.padStart(64, '0')),
        2n,
        [
          { assetId: AssetId('ETH-9'), balance: 3n, fundingIndex: 4n },
          { assetId: AssetId('BTC-10'), balance: 5n, fundingIndex: 6n },
        ]
      )

      tree = await tree.update([
        { index: 2n, value: positionLeafA },
        { index: 7n, value: positionLeafB },
      ])

      expect(await tree.hash()).toEqual(
        PedersenHash(
          '07b56631b126137c5e21afb5b9bc187d3cce0c549dfbbf58abdd6b00a3b3527a'
        )
      )
    })

    it('persists updated nodes to the database', async () => {
      const storage = new InMemoryMerkleStorage()
      let tree = await MerkleTree.create(storage, 3n, PositionLeaf.EMPTY)

      let persisted: MerkleValue[] = []
      storage.persist = async (values) => {
        persisted = values
      }

      tree = await tree.update([
        { index: 2n, value: positionLeafA },
        { index: 7n, value: positionLeafB },
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
    const positionLeafA = new PositionLeaf(StarkKey.fake('dead'), 420n, [])
    const positionLeafB = new PositionLeaf(StarkKey.fake('beef'), 69n, [])

    it('can recover a persisted state', async () => {
      const storage = new InMemoryMerkleStorage()
      let tree = await MerkleTree.create(storage, 3n, PositionLeaf.EMPTY)
      tree = await tree.update([
        { index: 2n, value: positionLeafA },
        { index: 7n, value: positionLeafB },
      ])

      const recovered = new MerkleTree(storage, 3n, await tree.hash())
      expect(await recovered.getLeaf(2n)).toEqual(positionLeafA)
    })
  })
})
