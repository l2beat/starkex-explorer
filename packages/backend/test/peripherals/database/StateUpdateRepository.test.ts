import { expect } from 'earljs'

import { StateUpdateRepository } from '../../../src/peripherals/database/StateUpdateRepository'
import { Logger, LogLevel } from '../../../src/tools/Logger'
import { setupDatabaseTestSuite } from './setup'

describe(StateUpdateRepository.name, () => {
  const { knex } = setupDatabaseTestSuite()

  const repository = new StateUpdateRepository(
    knex,
    new Logger({ format: 'pretty', logLevel: LogLevel.ERROR })
  )

  afterEach(() => repository.deleteAll())

  describe(repository.add.name, () => {})

  describe(repository.delete.name, () => {
    it('removes prices and positions from database', async () => {
      await repository.add({
        stateUpdate: {
          id: 10_000,
          blockNumber: 10_000,
          rootHash: 'rootHash',
          factHash: 'factHash',
          factTimestamp: 0,
          dataTimestamp: 0,
        },
        positions: [
          // @todo
        ],
        prices: [
          // @todo
        ],
      })

      await repository.delete(10_000)

      const remainingPrices = await knex('prices').select('*')
      const remainingPositions = await knex('positions').select('*')

      expect(remainingPrices.length).toEqual(0)
      expect(remainingPositions.length).toEqual(0)
    })
  })
})
