import { AssetHash, AssetId, PedersenHash, StarkKey } from '@explorer/types'
import { expect } from 'earl'

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

  describe(MerkleTree.prototype.getMerkleProofForLeaf.name, () => {
    it('generates correct merkle proof for a tree with PositionLeaf', async () => {
      const storage = new InMemoryMerkleStorage()
      let tree = await MerkleTree.create(storage, 3n, PositionLeaf.EMPTY)

      const positionLeafA = new PositionLeaf(StarkKey.fake('dead'), 420n, [])
      const positionLeafB = new PositionLeaf(StarkKey.fake('beef'), 69n, [
        { assetId: AssetId('BTC-10'), balance: 3n, fundingIndex: 4n },
      ])

      tree = await tree.update([
        { index: 2n, value: positionLeafA },
        { index: 7n, value: positionLeafB },
      ])

      const proof = await tree.getMerkleProofForLeaf(7n)
      expect(proof).toEqual({
        leaf: positionLeafB,
        leafIndex: 7n,
        leafPrefixLength: 3,
        path: [
          {
            left: PedersenHash(
              '0000000000000000000000000000000000000000000000000000000000000000'
            ),
            right: PedersenHash(
              '004254432d313000000000000000000080000000000000048000000000000003'
            ),
          },
          {
            left: PedersenHash(
              '0726c9603ac7bccf9523718f2f1b45fac7673780ae5089ecf2ab0e67f96f7dd0'
            ),
            right: PedersenHash(
              '0beef00000000000000000000000000000000000000000000000000000000000'
            ),
          },
          {
            left: PedersenHash(
              '0271eb38f2bf004c2407a88958620a5d2c25fcee84590e50f0d2e37858bfba62'
            ),
            right: PedersenHash(
              '0000000000000000000000000000000000000000000080000000000000450001'
            ),
          },
          {
            left: PedersenHash(
              '028109b4e56fad0455aa4b316045c93937b1e7e4e0fc663db375b9e67c80c620'
            ),
            right: PedersenHash(
              '040e52d372a32b20035f44f456e7beea936b35298c64f5b8d6a56604ff4b3a6d'
            ),
          },
          {
            left: PedersenHash(
              '037ff447129584d02735f8b24db6d39dfc7d1ccbd7459fca871b795bffbeddf2'
            ),
            right: PedersenHash(
              '00968c9e36fd542708ca7d03ce09b81835ee1da53d50faa4bba820b28da6f93e'
            ),
          },
          {
            left: PedersenHash(
              '07d54313f8a6085c0f072dab5a3bbb28132f74b4adc3a00238c465163d052ed4'
            ),
            right: PedersenHash(
              '0490d6399cb336c5b4f017c608cdf662dba1942fbbc9c744d7e1cdda5feedaf9'
            ),
          },
        ],
        perpetualAssetCount: 1,
        root: PedersenHash(
          '00c9c74a31d9247f04cc9dbef31686d072fec342810c56d53855fa81e7af4bfd'
        ),
      })
    })

    it('generates correct merkle proof for a tree with VaultLeaf', async () => {
      const storage = new InMemoryMerkleStorage()
      let tree = await MerkleTree.create(storage, 3n, PositionLeaf.EMPTY)

      const vaultLeafA = new VaultLeaf(
        StarkKey.fake('dead'),
        123000n,
        AssetHash.fake('abc')
      )
      const vaultLeafB = new VaultLeaf(
        StarkKey.fake('beef'),
        456000n,
        AssetHash.fake('def')
      )

      tree = await tree.update([
        { index: 2n, value: vaultLeafA },
        { index: 7n, value: vaultLeafB },
      ])

      const proof = await tree.getMerkleProofForLeaf(7n)
      expect(proof).toEqual({
        leaf: vaultLeafB,
        leafIndex: 7n,
        leafPrefixLength: 0,
        path: [
          {
            left: PedersenHash(
              '028109b4e56fad0455aa4b316045c93937b1e7e4e0fc663db375b9e67c80c620'
            ),
            right: PedersenHash(
              '07d05226e7e24660010d9a366e585b2deb5e2fcdf4431c7f2e1e8808b8ad1bd5'
            ),
          },
          {
            left: PedersenHash(
              '037ff447129584d02735f8b24db6d39dfc7d1ccbd7459fca871b795bffbeddf2'
            ),
            right: PedersenHash(
              '05d09d0e91067aa668880c668e105a0a510a056b04cd7ea37bd0c01357c7754a'
            ),
          },
          {
            left: PedersenHash(
              '0614aa7ecda7618ddd79577a038b2691ceaebea5424a745e87e077a58b5f3e09'
            ),
            right: PedersenHash(
              '01361b33d7c1a5697b4de3daed7c7790116020dd5c7c9b37e6ff1ec929f175af'
            ),
          },
        ],
        perpetualAssetCount: 0,
        root: PedersenHash(
          '014f10fe0dfad76a60a8279bb67645b25db72b2af9125303a637468ddc48b953'
        ),
      })
    })
  })
})
