import { AssetHash, StarkKey, Timestamp } from '@explorer/types'
import { expect } from 'earljs'
import { Knex } from 'knex'

import { setupDatabaseTestSuite } from '../../test/database'
import { Logger, LogLevel } from '../../tools/Logger'
import {
  PreprocessedAssetHistoryRecord,
  PreprocessedAssetHistoryRepository,
} from './PreprocessedAssetHistoryRepository'

const genericRecord: Omit<PreprocessedAssetHistoryRecord, 'historyId'> = {
  stateUpdateId: 1900,
  blockNumber: 1_000_000,
  timestamp: Timestamp(900_000_000n),
  starkKey: StarkKey.fake('987fa'),
  positionOrVaultId: 500n,
  assetHashOrId: AssetHash.fake(),
  balance: 100_000_000n,
  prevBalance: 900_000_000n,
  price: 123_456n,
  prevPrice: 234_456n,
  isCurrent: true,
  prevHistoryId: 99,
}

describe(PreprocessedAssetHistoryRepository.name, () => {
  const { database } = setupDatabaseTestSuite()
  let trx: Knex.Transaction

  const repository = new PreprocessedAssetHistoryRepository(
    database,
    AssetHash,
    new Logger({ format: 'pretty', logLevel: LogLevel.ERROR })
  )

  beforeEach(async () => {
    const knex = await database.getKnex()
    trx = await knex.transaction()
    await repository.deleteAll(trx)
  })

  afterEach(async () => {
    await trx.rollback()
  })

  it('adds, finds and deletes asset history record', async () => {
    const id = await repository.add(genericRecord, trx)

    const record = await repository.findByHistoryId(id, trx)
    expect(record).toEqual({ ...genericRecord, historyId: id })

    await repository.deleteByHistoryId(id, trx)
    const recordAfterDelete = await repository.findByHistoryId(id, trx)
    expect(recordAfterDelete).toEqual(undefined)
  })

  it('gets current non-empty records by stark key', async () => {
    const starkKey = StarkKey.fake('1')

    // This record should be returned (balance > 0, isCurrent = true)
    await repository.add(
      {
        ...genericRecord,
        starkKey,
        positionOrVaultId: 100n,
        balance: 100_000_000n,
        isCurrent: true,
      },
      trx
    )
    // This record should be returned (balance > 0, isCurrent = true)
    await repository.add(
      {
        ...genericRecord,
        starkKey,
        positionOrVaultId: 101n,
        balance: 200_000_000n,
        isCurrent: true,
      },
      trx
    )
    // This records should be ignored (balance = 0, isCurrent = true)
    await repository.add(
      {
        ...genericRecord,
        starkKey,
        positionOrVaultId: 102n,
        balance: 0n,
        isCurrent: true,
      },
      trx
    )
    // This records should be ignored (balance > 0, isCurrent = false)
    await repository.add(
      {
        ...genericRecord,
        starkKey,
        positionOrVaultId: 103n,
        balance: 200_000_000n,
        isCurrent: false,
      },
      trx
    )
    // This record should be ignored (balance > 0, isCurrent = true but different starkKey)
    await repository.add(
      {
        ...genericRecord,
        starkKey: StarkKey.fake('2'),
        positionOrVaultId: 104n,
        balance: 300_000_000n,
        isCurrent: true,
      },
      trx
    )

    const records = await repository.getCurrentNonEmptyByStarkKey(starkKey, trx)
    expect(records.map((r) => r.positionOrVaultId).sort()).toEqual([100n, 101n])
  })

  it('deletes by history id', async () => {
    const starkKey = StarkKey.fake()

    const historyId1 = await repository.add(
      {
        ...genericRecord,
        starkKey,
        balance: 100_000_000n,
        isCurrent: true,
      },
      trx
    )
    const historyId2 = await repository.add(
      {
        ...genericRecord,
        starkKey,
        balance: 200_000_000n,
        isCurrent: true,
      },
      trx
    )
    let records = await repository.getCurrentNonEmptyByStarkKey(starkKey, trx)
    expect(records.length).toEqual(2)

    await repository.deleteByHistoryId(historyId1, trx)

    records = await repository.getCurrentNonEmptyByStarkKey(starkKey, trx)
    expect(records.length).toEqual(1)
    expect(records[0]?.historyId).toEqual(historyId2)
  })

  it('gets current non-empty records by position or vault id', async () => {
    const id = await repository.add(
      {
        ...genericRecord,
        positionOrVaultId: 100n,
        balance: 100_000_000n,
        isCurrent: true,
      },
      trx
    )
    await repository.add(
      {
        ...genericRecord,
        positionOrVaultId: 101n, // different position so should not be returned
        balance: 200_000_000n,
        isCurrent: true,
      },
      trx
    )
    // ignored because balance == 0
    await repository.add(
      {
        ...genericRecord,
        positionOrVaultId: 100n,
        balance: 0n,
        isCurrent: true,
      },
      trx
    )
    // ignored because not current
    await repository.add(
      {
        ...genericRecord,
        positionOrVaultId: 100n,
        balance: 200_000_000n,
        isCurrent: false,
      },
      trx
    )

    const records = await repository.getCurrentNonEmptyByPositionOrVaultId(
      100n,
      trx
    )
    expect(records.map((r) => r.historyId)).toEqual([id])
  })

  it('gets current (even empty) records by stark key and asset hashes', async () => {
    const starkKey = StarkKey.fake('a')
    const assetHash1 = AssetHash.fake('1')
    const assetHash2 = AssetHash.fake('2')
    const assetHash3 = AssetHash.fake('3')

    await repository.add(
      {
        ...genericRecord,
        assetHashOrId: assetHash1,
        starkKey,
        positionOrVaultId: 100n,
        balance: 100_000_000n,
        isCurrent: true,
      },
      trx
    )
    await repository.add(
      {
        ...genericRecord,
        assetHashOrId: assetHash2,
        starkKey,
        positionOrVaultId: 101n,
        balance: 200_000_000n,
        isCurrent: true,
      },
      trx
    )
    await repository.add(
      {
        ...genericRecord,
        starkKey,
        assetHashOrId: assetHash2,
        positionOrVaultId: 102n,
        balance: 0n, // This record should be returned (even when balance = 0)
        isCurrent: true,
      },
      trx
    )
    // This records should be ignored (assetHash not requested)
    await repository.add(
      {
        ...genericRecord,
        starkKey,
        assetHashOrId: AssetHash.fake('000fa'),
        positionOrVaultId: 103n,
        balance: 200_000_000n,
        isCurrent: false,
      },
      trx
    )
    // This records should be ignored (isCurrent = false)
    await repository.add(
      {
        ...genericRecord,
        starkKey,
        assetHashOrId: assetHash3,
        positionOrVaultId: 104n,
        balance: 200_000_000n,
        isCurrent: false,
      },
      trx
    )
    // This record should be ignored (different starkKey)
    await repository.add(
      {
        ...genericRecord,
        starkKey: StarkKey.fake('2'),
        assetHashOrId: assetHash3,
        positionOrVaultId: 105n,
        balance: 300_000_000n,
        isCurrent: true,
      },
      trx
    )

    const records = await repository.getCurrentByStarkKeyAndAssets(
      starkKey,
      [assetHash1, assetHash2, assetHash3],
      trx
    )
    expect(records.map((r) => r.positionOrVaultId).sort()).toEqual([
      100n,
      101n,
      102n,
    ])
  })

  it('sets isCurrent to true by history id', async () => {
    const id1 = await repository.add(
      {
        ...genericRecord,
        isCurrent: false,
      },
      trx
    )
    const id2 = await repository.add(
      {
        ...genericRecord,
        isCurrent: false,
      },
      trx
    )

    await repository.setAsCurrentByHistoryId(id1, trx)

    const record1 = await repository.findByHistoryId(id1, trx)
    const record2 = await repository.findByHistoryId(id2, trx)
    expect(record1?.isCurrent).toEqual(true)
    expect(record2?.isCurrent).toEqual(false)
  })

  it('sets isCurrent to false by stark key and asset hash', async () => {
    const starkKey = StarkKey.fake('a')
    const assetHash1 = AssetHash.fake('1')
    const assetHash2 = AssetHash.fake('2')

    const id1 = await repository.add(
      {
        ...genericRecord,
        assetHashOrId: assetHash1,
        starkKey,
        positionOrVaultId: 100n,
        balance: 100_000_000n,
        isCurrent: true,
      },
      trx
    )
    const id2 = await repository.add(
      {
        ...genericRecord,
        assetHashOrId: assetHash2,
        starkKey,
        positionOrVaultId: 101n,
        balance: 200_000_000n,
        isCurrent: true,
      },
      trx
    )
    const id3 = await repository.add(
      {
        ...genericRecord,
        starkKey,
        assetHashOrId: assetHash2,
        positionOrVaultId: 102n,
        balance: 0n,
        isCurrent: true,
      },
      trx
    )
    const id4 = await repository.add(
      {
        ...genericRecord,
        starkKey: StarkKey.fake('000fa'), // different stark key
        assetHashOrId: assetHash2, // same asset
        positionOrVaultId: 102n,
        balance: 0n,
        isCurrent: true,
      },
      trx
    )

    await repository.unsetCurrentByStarkKeyAndAsset(starkKey, assetHash2, trx)

    const record1 = await repository.findByHistoryId(id1, trx)
    const record2 = await repository.findByHistoryId(id2, trx)
    const record3 = await repository.findByHistoryId(id3, trx)
    const record4 = await repository.findByHistoryId(id4, trx)
    expect(record1?.isCurrent).toEqual(true)
    expect(record2?.isCurrent).toEqual(false)
    expect(record3?.isCurrent).toEqual(false)
    expect(record4?.isCurrent).toEqual(true)
  })

  it('returns prevHistoryId of all records from a given state update', async () => {
    const id1 = await repository.add(
      {
        ...genericRecord,
        stateUpdateId: 100,
        isCurrent: true,
        prevHistoryId: 100,
      },
      trx
    )
    const id2 = await repository.add(
      {
        ...genericRecord,
        stateUpdateId: 100,
        isCurrent: true,
        prevHistoryId: 101,
      },
      trx
    )
    const id3 = await repository.add(
      {
        ...genericRecord,
        stateUpdateId: 100,
        isCurrent: true,
        prevHistoryId: undefined, // should still be returned because id is used
      },
      trx
    )
    await repository.add(
      {
        ...genericRecord,
        stateUpdateId: 100,
        isCurrent: false, // record should be ignored
        prevHistoryId: 102,
      },
      trx
    )
    await repository.add(
      {
        ...genericRecord,
        stateUpdateId: 200, // different id, ignored
        isCurrent: true,
        prevHistoryId: 103,
      },
      trx
    )

    const prevHistoryIds =
      await repository.getPrevHistoryIdOfCurrentWithStateUpdateId(100, trx)
    expect(prevHistoryIds.map((r) => r.historyId).sort()).toEqual(
      [id1, id2, id3].sort()
    )
    expect(prevHistoryIds.map((r) => r.prevHistoryId).sort()).toEqual([
      100,
      101,
      undefined,
    ])
  })
})
