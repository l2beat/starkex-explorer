import { MerkleNode, PositionLeaf } from '@explorer/state'
import { AssetId, PedersenHash, StarkKey } from '@explorer/types'
import { expect } from 'earljs'

import { setupDatabaseTestSuite } from '../../test/database'
import { Logger } from '../../tools/Logger'
import { MerkleTreeRepository } from './MerkleTreeRepository'

describe(MerkleTreeRepository.name, () => {
  const { database } = setupDatabaseTestSuite()
  const repository = new MerkleTreeRepository(
    database,
    Logger.SILENT,
    PositionLeaf
  )

  afterEach(() => repository.deleteAll())

  describe(MerkleTreeRepository.prototype.persist.name, () => {
    it('persists and recover a merkle node', async () => {
      const node = new MerkleNode(
        repository,
        PedersenHash.fake('111'),
        PedersenHash.fake('222'),
        PedersenHash.fake('333')
      )
      await repository.persist([node])
      const recovered = await repository.recover(PedersenHash.fake('333'))
      expect(recovered).toEqual(node)
    })

    it('persists and recover a PositionLeaf', async () => {
      const positionLeaf = new PositionLeaf(
        StarkKey.fake('deadbeef'),
        123n,
        [{ assetId: AssetId('ETH-9'), balance: 456n, fundingIndex: 789n }],
        PedersenHash.fake('abc')
      )
      await repository.persist([positionLeaf])
      const recovered = await repository.recover(PedersenHash.fake('abc'))
      expect(recovered).toEqual(positionLeaf)
    })

    it('persists and recover multiple merkle nodes', async () => {
      const nodeA = new MerkleNode(
        repository,
        PedersenHash.fake('A1A'),
        PedersenHash.fake('A2A'),
        PedersenHash.fake('A3A')
      )
      const nodeB = new MerkleNode(
        repository,
        PedersenHash.fake('B1B'),
        PedersenHash.fake('B2B'),
        PedersenHash.fake('B3B')
      )
      await repository.persist([nodeA, nodeB])
      const recoveredA = await repository.recover(PedersenHash.fake('A3A'))
      expect(recoveredA).toEqual(nodeA)
      const recoveredB = await repository.recover(PedersenHash.fake('B3B'))
      expect(recoveredB).toEqual(nodeB)
    })

    it('persists the same node multiple times', async () => {
      const node = new MerkleNode(
        repository,
        PedersenHash.fake('111'),
        PedersenHash.fake('222'),
        PedersenHash.fake('333')
      )
      await repository.persist([node])
      await repository.persist([node])
      const recovered = await repository.recover(PedersenHash.fake('333'))
      expect(recovered).toEqual(node)
    })

    it('persists the same node multiple times in one update', async () => {
      const node = new MerkleNode(
        repository,
        PedersenHash.fake('111'),
        PedersenHash.fake('222'),
        PedersenHash.fake('333')
      )
      await repository.persist([node, node])
    })

    it('persists the same position multiple times in one update', async () => {
      const positionLeaf = new PositionLeaf(
        StarkKey.fake('deadbeef'),
        123n,
        [{ assetId: AssetId('ETH-9'), balance: 456n, fundingIndex: 789n }],
        PedersenHash.fake('abc')
      )
      await repository.persist([positionLeaf, positionLeaf])
    })
  })
})
