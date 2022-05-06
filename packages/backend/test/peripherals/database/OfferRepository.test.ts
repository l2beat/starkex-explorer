import { AssetId, StarkKey } from '@explorer/types'
import { expect } from 'earljs'

import {
  OfferRecord,
  OfferRepository,
} from '../../../src/peripherals/database/OfferRepository'
import { Logger } from '../../../src/tools/Logger'
import { setupDatabaseTestSuite } from './setup'

const record1: OfferRecord = {
  starkKeyA: StarkKey.fake(),
  positionIdA: 1n,
  syntheticAssetId: AssetId('ETH-18'),
  amountCollateral: 20n,
  amountSynthetic: 1000n,
  aIsBuyingSynthetic: true,
}

const record2: OfferRecord = {
  starkKeyA: StarkKey.fake(),
  positionIdA: 2n,
  syntheticAssetId: AssetId('LINK-18'),
  amountCollateral: 50n,
  amountSynthetic: 600n,
  aIsBuyingSynthetic: false,
}

const record3: OfferRecord = {
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
    await repository.add([record1])

    const actual = await repository.getAll()

    expect(actual).toEqual([record1])
  })

  it('adds 0 records', async () => {
    await repository.add([])
    expect(await repository.getAll()).toEqual([])
  })

  it('adds multiple records and queries them', async () => {
    const records = [record1, record2, record3]

    await repository.add(records)
    const actual = await repository.getAll()

    expect(actual).toEqual(records)
  })

  it('deletes all records', async () => {
    await repository.add([record1, record2])

    await repository.deleteAll()

    const actual = await repository.getAll()
    expect(actual).toEqual([])
  })
})
