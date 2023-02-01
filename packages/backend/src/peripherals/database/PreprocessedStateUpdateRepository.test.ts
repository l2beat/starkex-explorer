import { Hash256 } from '@explorer/types'
import { expect } from 'earljs'

import { setupDatabaseTestSuite } from '../../test/database'
import { Logger, LogLevel } from '../../tools/Logger'
import { PreprocessedStateUpdateRepository } from './PreprocessedStateUpdateRepository'

describe(PreprocessedStateUpdateRepository.name, () => {
  const { database } = setupDatabaseTestSuite()

  const repository = new PreprocessedStateUpdateRepository(
    database,
    new Logger({ format: 'pretty', logLevel: LogLevel.ERROR })
  )

  beforeEach(() => repository.deleteAll())

  it('adds preprocessed state update', async () => {
    await repository.add({
      stateUpdateId: 10_000,
      stateTransitionHash: Hash256.fake(),
    })
  })

  it('gets last state update by id', async () => {
    let last = await repository.findLast()

    expect(last).toEqual(undefined)

    for (const blockNumber of [30_001, 30_002, 30_003]) {
      await repository.add({
        stateUpdateId: blockNumber * 1000,
        stateTransitionHash: Hash256.fake(),
      })
    }
    const stateUpdate = {
      stateUpdateId: 30_004_000,
      stateTransitionHash: Hash256.fake(),
    }
    await repository.add(stateUpdate)

    last = await repository.findLast()

    expect(last).toEqual(stateUpdate)
  })

  it('removes by state update id', async () => {
    for (const blockNumber of [30_001, 30_002, 30_003]) {
      await repository.add({
        stateUpdateId: blockNumber * 1000,
        stateTransitionHash: Hash256.fake(),
      })
    }

    await repository.deleteByStateUpdateId(30_003_000)

    expect((await repository.findLast())?.stateUpdateId).toEqual(30_002_000)
  })
})
