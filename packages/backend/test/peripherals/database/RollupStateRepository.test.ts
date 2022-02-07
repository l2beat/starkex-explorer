import { PedersenHash } from '@explorer/crypto'
import { AssetId } from '@explorer/encoding'
import { MerkleNode, Position } from '@explorer/state'
import { expect } from 'earljs'

import { RollupStateRepository } from '../../../src/peripherals/database/RollupStateRepository'
import { Logger } from '../../../src/tools/Logger'
import { setupDatabaseTestSuite } from './setup'

describe(RollupStateRepository.name, () => {
  const { knex } = setupDatabaseTestSuite()
  const repository = new RollupStateRepository(knex, Logger.SILENT)

  afterEach(() => repository.deleteAll())

  describe(RollupStateRepository.prototype.persist.name, () => {
    it('can persist and recover a merkle node', async () => {
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

    it('can persist and recover a Position', async () => {
      const position = new Position(
        'deadbeef',
        123n,
        [{ assetId: AssetId('ETH-9'), balance: 456n, fundingIndex: 789n }],
        PedersenHash.fake('abc')
      )
      await repository.persist([position])
      const recovered = await repository.recover(PedersenHash.fake('abc'))
      expect(recovered).toEqual(position)
    })

    it('can persist and recover multiple merkle nodes', async () => {
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

    it('can persist the same node multiple times', async () => {
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
  })
})
