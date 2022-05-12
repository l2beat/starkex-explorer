import { Hash256, PedersenHash, StarkKey, Timestamp } from '@explorer/types'
import { expect } from 'earljs'

import { PositionRepository } from '../../../src/peripherals/database/PositionRepository'
import { StateUpdateRepository } from '../../../src/peripherals/database/StateUpdateRepository'
import { Logger, LogLevel } from '../../../src/tools/Logger'
import { setupDatabaseTestSuite } from './setup'

describe(StateUpdateRepository.name, () => {
  const { knex } = setupDatabaseTestSuite()

  const logger = new Logger({ format: 'pretty', logLevel: LogLevel.ERROR })
  const stateUpdateRepository = new StateUpdateRepository(knex, logger)
  const positionRepository = new PositionRepository(knex, logger)

  afterEach(() => stateUpdateRepository.deleteAll())

  it('returns the count of all positions', async () => {
    const fakeUpdate = (id: number) => ({
      id,
      blockNumber: id * 1000,
      rootHash: PedersenHash.fake(),
      factHash: Hash256.fake(),
      timestamp: Timestamp(0),
    })
    const fakePosition = (id: bigint) => ({
      publicKey: StarkKey.fake(),
      positionId: id,
      collateralBalance: 0n,
      balances: [],
    })

    await stateUpdateRepository.add({
      stateUpdate: fakeUpdate(1),
      positions: [fakePosition(123n), fakePosition(456n)],
      prices: [],
    })
    await stateUpdateRepository.add({
      stateUpdate: fakeUpdate(2),
      positions: [fakePosition(456n), fakePosition(789n)],
      prices: [],
    })

    const count = await positionRepository.count()
    expect(count).toEqual(3n)
  })
})
