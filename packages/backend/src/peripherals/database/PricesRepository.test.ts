import { AssetId, Hash256, PedersenHash, Timestamp } from '@explorer/types'
import { Logger } from '@l2beat/backend-tools'
import { expect } from 'earl'
import { it } from 'mocha'

import { setupDatabaseTestSuite } from '../../test/database'
import { PricesRepository } from './PricesRepository'
import { StateUpdateRepository } from './StateUpdateRepository'

describe(PricesRepository.name, () => {
  const { database } = setupDatabaseTestSuite()
  const stateUpdateRepository = new StateUpdateRepository(
    database,
    Logger.SILENT
  )
  const repository = new PricesRepository(database, Logger.SILENT)

  afterEach(() => repository.deleteAll())

  describe(PricesRepository.prototype.getAllLatest.name, () => {
    it('returns prices for all assets for the latest state update', async () => {
      await stateUpdateRepository.add(mockStateUpdate(1))
      await stateUpdateRepository.add(mockStateUpdate(199))
      await stateUpdateRepository.add(mockStateUpdate(200))

      await repository.add({
        stateUpdateId: 200,
        assetId: AssetId('MATIC-6'),
        price: 100n,
      })
      await repository.add({
        stateUpdateId: 200,
        assetId: AssetId('LTC-8'),
        price: 100n,
      })
      await repository.add({
        stateUpdateId: 200,
        assetId: AssetId('ETH-9'),
        price: 100n,
      })
      await repository.add({
        stateUpdateId: 199,
        assetId: AssetId('USDC-6'),
        price: 100n,
      })
      await repository.add({
        stateUpdateId: 1,
        assetId: AssetId('ETH-9'),
        price: 100n,
      })

      const results = await repository.getAllLatest()
      expect(results).toEqualUnsorted([
        { stateUpdateId: 200, assetId: AssetId('MATIC-6'), price: 100n },
        { stateUpdateId: 200, assetId: AssetId('LTC-8'), price: 100n },
        { stateUpdateId: 200, assetId: AssetId('ETH-9'), price: 100n },
      ])
    })
  })
})

function mockStateUpdate(id: number) {
  return {
    stateUpdate: {
      id,
      batchId: id - 1,
      blockNumber: id,
      rootHash: PedersenHash.fake(),
      stateTransitionHash: Hash256.fake(),
      timestamp: Timestamp(0),
    },
    positions: [],
    prices: [],
    transactionHashes: [],
  }
}
