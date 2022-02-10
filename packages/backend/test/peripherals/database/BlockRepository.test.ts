import { expect } from 'earljs'
import { range } from 'lodash'

import { Hash256 } from '../../../src/model'
import {
  BlockRecord,
  BlockRepository,
} from '../../../src/peripherals/database/BlockRepository'
import { Logger } from '../../../src/tools/Logger'
import { setupDatabaseTestSuite } from './setup'

describe(BlockRepository.name, () => {
  const { knex } = setupDatabaseTestSuite()
  const repository = new BlockRepository(knex, Logger.SILENT)

  afterEach(() => repository.deleteAll())

  it('adds single record and queries it', async () => {
    const record: BlockRecord = { number: 1, hash: Hash256.fake() }

    await repository.add([record])

    const actual = await repository.getAll()

    expect(actual).toEqual([record])
  })

  it('adds 0 records', async () => {
    await repository.add([])
    expect(await repository.getAll()).toEqual([])
  })

  it('adds multiple records and queries them', async () => {
    const records: BlockRecord[] = [
      { number: 1, hash: Hash256.fake() },
      { number: 2, hash: Hash256.fake() },
      { number: 3, hash: Hash256.fake() },
    ]

    await repository.add(records)
    const actual = await repository.getAll()

    expect(actual).toEqual(records)
  })

  it('deletes all records', async () => {
    await repository.add([
      { number: 1, hash: Hash256.fake() },
      { number: 2, hash: Hash256.fake() },
    ])

    await repository.deleteAll()

    const actual = await repository.getAll()
    expect(actual).toEqual([])
  })

  it('deletes all records after a block number', async () => {
    const records: BlockRecord[] = Array.from({ length: 10 }).map((_, i) => ({
      hash: Hash256.fake(),
      number: i,
    }))
    await repository.add(records)

    await repository.deleteAllAfter(5)

    const actual = await repository.getAll()
    expect(actual).toEqual(records.filter((r) => r.number <= 5))
  })

  it('gets by hash', async () => {
    const record = { number: 1, hash: Hash256.fake() }

    await repository.add([record])

    expect(await repository.getByHash(record.hash)).toEqual(record)

    expect(await repository.getByHash(Hash256.fake('000'))).toEqual(undefined)
  })

  it('gets by number', async () => {
    const record = { number: 1, hash: Hash256.fake() }

    await repository.add([record])

    expect(await repository.getByNumber(record.number)).toEqual(record)

    expect(await repository.getByNumber(2)).toEqual(undefined)
  })

  it('gets last by number', async () => {
    expect(await repository.getLast()).toEqual(undefined)

    const block = { number: 11813208, hash: Hash256.fake() }
    await repository.add([block])

    expect(await repository.getLast()).toEqual(block)

    const earlierBlock = { number: 11813206, hash: Hash256.fake() }
    const laterBlock = { number: 11813209, hash: Hash256.fake() }
    await repository.add([laterBlock, earlierBlock])

    expect(await repository.getLast()).toEqual(laterBlock)
  })

  it('gets all blocks in range between given numbers (inclusive)', async () => {
    const blocks = range(10, 20).map((i) => ({
      number: i,
      hash: Hash256.fake(),
    }))
    await repository.add(blocks)

    expect(await repository.getAllInRange(13, 17)).toEqual([
      blocks[3],
      blocks[4],
      blocks[5],
      blocks[6],
      blocks[7],
    ])
  })
})
