import { AssetId, StarkKey, Timestamp } from '@explorer/types'
import { expect } from 'earljs'

import {
  OfferRecordCandidate,
  OfferRepository,
} from '../../../src/peripherals/database/OfferRepository'
import { Logger } from '../../../src/tools/Logger'
import { setupDatabaseTestSuite } from './setup'

const record1: OfferRecordCandidate = {
  createdAt: Timestamp(1),
  starkKeyA: StarkKey.fake(),
  positionIdA: 1n,
  syntheticAssetId: AssetId('ETH-18'),
  amountCollateral: 20n,
  amountSynthetic: 1000n,
  aIsBuyingSynthetic: true,
}

const record2: OfferRecordCandidate = {
  createdAt: Timestamp(100),
  starkKeyA: StarkKey.fake(),
  positionIdA: 2n,
  syntheticAssetId: AssetId('LINK-18'),
  amountCollateral: 50n,
  amountSynthetic: 600n,
  aIsBuyingSynthetic: false,
}

const record3: OfferRecordCandidate = {
  createdAt: Timestamp(1000),
  starkKeyA: StarkKey.fake(),
  positionIdA: 3n,
  syntheticAssetId: AssetId('DAI-18'),
  amountCollateral: 500n,
  amountSynthetic: 500n,
  aIsBuyingSynthetic: true,
}

describe(OfferRepository.name, () => {
  const { knex } = setupDatabaseTestSuite()
  const repository = new OfferRepository(knex, Logger.SILENT)

  afterEach(() => repository.deleteAll())

  it('adds single record and queries it', async () => {
    const id = await repository.addOne(record1)

    const actual = await repository.getAll()

    expect(actual).toEqual([{ id, ...record1 }])
  })

  it('queries all records', async () => {
    const id1 = await repository.addOne(record1)
    const id2 = await repository.addOne(record2)

    const actual = await repository.getAll()

    expect(actual).toEqual([
      { id: id1, ...record1 },
      { id: id2, ...record2 },
    ])
  })

  it('queries record by id', async () => {
    await repository.addOne(record2)
    const id = await repository.addOne(record1)
    await repository.addOne(record3)

    const actual = await repository.getById(id)

    expect(actual).toEqual({ id, ...record1 })
  })

  it('deletes all records', async () => {
    await repository.addOne(record1)
    await repository.addOne(record2)

    await repository.deleteAll()

    const actual = await repository.getAll()
    expect(actual).toEqual([])
  })
})
