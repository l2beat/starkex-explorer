import { AssetHash, Hash256, StarkKey, Timestamp } from '@explorer/types'
import { expect } from 'earljs'
import { Knex } from 'knex'

import { setupDatabaseTestSuite } from '../../test/database'
import { Logger, LogLevel } from '../../tools/Logger'
import {
  PreprocessedAssetHistoryRecord,
  PreprocessedAssetHistoryRepository,
} from './PreprocessedAssetHistoryRepository'
import { PreprocessedStateUpdateRepository } from './PreprocessedStateUpdateRepository'

const genericRecord: Omit<
  PreprocessedAssetHistoryRecord<AssetHash>,
  'historyId'
> = {
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
  const preprocessedStateUpdateRepository =
    new PreprocessedStateUpdateRepository(database, Logger.SILENT)

  beforeEach(async () => {
    const knex = await database.getKnex()
    trx = await knex.transaction()
    // adding records to preprocessed_asset_history table
    // to satisfy foreign key constraint of state_update_id
    await preprocessedStateUpdateRepository.deleteAll(trx)
    await preprocessedStateUpdateRepository.add(
      {
        stateUpdateId: 1900,
        stateTransitionHash: Hash256.fake('19000'),
      },
      trx
    )
    await preprocessedStateUpdateRepository.add(
      {
        stateUpdateId: 100,
        stateTransitionHash: Hash256.fake('12000'),
      },
      trx
    )
    await preprocessedStateUpdateRepository.add(
      {
        stateUpdateId: 200,
        stateTransitionHash: Hash256.fake('13000'),
      },
      trx
    )
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

  it('gets current records by stark key', async () => {
    const starkKey = StarkKey.fake('1')

    // This record should be returned (balance > 0, isCurrent = true)
    await repository.add(
      {
        ...genericRecord,
        assetHashOrId: AssetHash.fake('1'),
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
        assetHashOrId: AssetHash.fake('2'),
        starkKey,
        positionOrVaultId: 101n,
        balance: 200_000_000n,
        isCurrent: true,
      },
      trx
    )
    // This records should be ignored (balance = 0, isCurrent = false)
    await repository.add(
      {
        ...genericRecord,
        assetHashOrId: AssetHash.fake('3'),
        starkKey,
        positionOrVaultId: 102n,
        balance: 0n,
        isCurrent: false,
      },
      trx
    )
    // This records should be ignored (balance > 0, isCurrent = false)
    await repository.add(
      {
        ...genericRecord,
        assetHashOrId: AssetHash.fake('4'),
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
        assetHashOrId: AssetHash.fake('5'),
        starkKey: StarkKey.fake('2'),
        positionOrVaultId: 104n,
        balance: 300_000_000n,
        isCurrent: true,
      },
      trx
    )

    const records = await repository.getCurrentByStarkKey(starkKey, trx)
    expect(records.map((r) => r.positionOrVaultId).sort()).toEqual([100n, 101n])
  })

  it('deletes by history id', async () => {
    const starkKey = StarkKey.fake()

    const historyId1 = await repository.add(
      {
        ...genericRecord,
        assetHashOrId: AssetHash.fake('1'),
        starkKey,
        balance: 100_000_000n,
        isCurrent: true,
      },
      trx
    )
    const historyId2 = await repository.add(
      {
        ...genericRecord,
        assetHashOrId: AssetHash.fake('2'),
        starkKey,
        balance: 200_000_000n,
        isCurrent: true,
      },
      trx
    )
    let records = await repository.getCurrentByStarkKey(starkKey, trx)
    expect(records.length).toEqual(2)

    await repository.deleteByHistoryId(historyId1, trx)

    records = await repository.getCurrentByStarkKey(starkKey, trx)
    expect(records.length).toEqual(1)
    expect(records[0]?.historyId).toEqual(historyId2)
  })

  it('gets current records by position or vault id', async () => {
    const id1 = await repository.add(
      {
        ...genericRecord,
        assetHashOrId: AssetHash.fake('1'),
        positionOrVaultId: 100n,
        balance: 100_000_000n,
        isCurrent: true,
      },
      trx
    )
    await repository.add(
      {
        ...genericRecord,
        assetHashOrId: AssetHash.fake('2'),
        positionOrVaultId: 101n, // different position so should not be returned
        balance: 200_000_000n,
        isCurrent: true,
      },
      trx
    )
    // ignored because isCurrent = false (and balance = 0)
    await repository.add(
      {
        ...genericRecord,
        assetHashOrId: AssetHash.fake('3'),
        positionOrVaultId: 100n,
        balance: 0n,
        isCurrent: false,
      },
      trx
    )
    // ignored because not current
    await repository.add(
      {
        ...genericRecord,
        assetHashOrId: AssetHash.fake('4'),
        positionOrVaultId: 100n,
        balance: 200_000_000n,
        isCurrent: false,
      },
      trx
    )

    const records = await repository.getCurrentByPositionOrVaultId(100n, trx)
    expect(records.map((r) => r.historyId)).toEqual([id1])
  })

  it('gets current record by stark key and asset hash when record isCurrent', async () => {
    const starkKey = StarkKey.fake('a')
    const assetHash = AssetHash.fake('1')

    await repository.add(
      {
        ...genericRecord,
        assetHashOrId: assetHash,
        starkKey,
        positionOrVaultId: 100n,
        balance: 100_000_000n,
        isCurrent: true,
      },
      trx
    )
    // This record should be ignored (different starkKey)
    await repository.add(
      {
        ...genericRecord,
        starkKey: StarkKey.fake('2'),
        assetHashOrId: assetHash,
        positionOrVaultId: 105n,
        balance: 300_000_000n,
        isCurrent: true,
      },
      trx
    )

    const record = await repository.findCurrentByStarkKeyAndAsset(
      starkKey,
      assetHash,
      trx
    )
    expect(record?.positionOrVaultId).toEqual(100n)
  })

  it('skips record by stark key and asset hash when record isCurrent=false', async () => {
    const starkKey = StarkKey.fake('a')
    const assetHash = AssetHash.fake('1')

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
        assetHashOrId: assetHash,
        positionOrVaultId: 104n,
        balance: 200_000_000n,
        isCurrent: false,
      },
      trx
    )

    const records = await repository.findCurrentByStarkKeyAndAsset(
      starkKey,
      assetHash,
      trx
    )
    expect(records).toEqual(undefined)
  })

  it('sets isCurrent to true by history id', async () => {
    const id1 = await repository.add(
      {
        ...genericRecord,
        assetHashOrId: AssetHash.fake('1'),
        isCurrent: false,
      },
      trx
    )
    const id2 = await repository.add(
      {
        ...genericRecord,
        starkKey: StarkKey.fake('002fa'),
        assetHashOrId: AssetHash.fake('2'),
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

  it('sets isCurrent to false by positionOrVaultId and asset hash', async () => {
    const starkKey = StarkKey.fake('a')
    const positionId = 100n
    const assetHash1 = AssetHash.fake('1')
    const assetHash2 = AssetHash.fake('2')

    const id1 = await repository.add(
      {
        ...genericRecord,
        assetHashOrId: assetHash1,
        starkKey,
        positionOrVaultId: positionId,
        balance: 100_000_000n,
        isCurrent: true,
      },
      trx
    )
    const id2 = await repository.add(
      {
        ...genericRecord,
        assetHashOrId: assetHash2, // different asset
        starkKey,
        positionOrVaultId: positionId,
        balance: 200_000_000n,
        isCurrent: true,
      },
      trx
    )
    const id3 = await repository.add(
      {
        ...genericRecord,
        starkKey,
        assetHashOrId: assetHash2, // same asset
        positionOrVaultId: 102n, // different position
        balance: 300_000_000n,
        isCurrent: true,
      },
      trx
    )

    await repository.unsetCurrentByPositionOrVaultIdAndAsset(
      positionId,
      assetHash2,
      trx
    )

    const record1 = await repository.findByHistoryId(id1, trx)
    const record2 = await repository.findByHistoryId(id2, trx)
    const record3 = await repository.findByHistoryId(id3, trx)
    expect(record1?.isCurrent).toEqual(true)
    expect(record2?.isCurrent).toEqual(false)
    expect(record3?.isCurrent).toEqual(true)
  })

  it('returns prevHistoryId of all records from a given state update', async () => {
    const id1 = await repository.add(
      {
        ...genericRecord,
        assetHashOrId: AssetHash.fake('1'),
        stateUpdateId: 100,
        isCurrent: true,
        prevHistoryId: 100,
      },
      trx
    )
    const id2 = await repository.add(
      {
        ...genericRecord,
        assetHashOrId: AssetHash.fake('1'),
        positionOrVaultId: 501n,
        starkKey: StarkKey.fake('a1'),
        stateUpdateId: 100,
        isCurrent: true,
        prevHistoryId: 101,
      },
      trx
    )
    const id3 = await repository.add(
      {
        ...genericRecord,
        assetHashOrId: AssetHash.fake('2'),
        positionOrVaultId: 502n,
        starkKey: StarkKey.fake('a2'),
        stateUpdateId: 100,
        isCurrent: true,
        prevHistoryId: undefined, // should be returned, prevHistoryId is irrelevant
      },
      trx
    )
    const id4 = await repository.add(
      {
        ...genericRecord,
        assetHashOrId: AssetHash.fake('3'),
        positionOrVaultId: 503n,
        starkKey: StarkKey.fake('a3'),
        stateUpdateId: 100,
        isCurrent: false, // record should still be returned
        prevHistoryId: 103,
      },
      trx
    )
    await repository.add(
      {
        ...genericRecord,
        assetHashOrId: AssetHash.fake('4'),
        positionOrVaultId: 504n,
        starkKey: StarkKey.fake('a4'),
        stateUpdateId: 200, // different state update id, ignored
        isCurrent: true,
        prevHistoryId: 104,
      },
      trx
    )

    const prevHistoryIds = await repository.getPrevHistoryByStateUpdateId(
      100,
      trx
    )
    expect(prevHistoryIds.map((r) => r.historyId).sort()).toEqual(
      [id1, id2, id3, id4].sort()
    )
    expect(prevHistoryIds.map((r) => r.prevHistoryId).sort()).toEqual([
      100,
      101,
      103,
      undefined,
    ])
  })

  it('gets by state update id - paginated and count', async () => {
    const stateUpdateId = 200

    const id1 = await repository.add(
      {
        ...genericRecord,
        assetHashOrId: AssetHash.fake('1'),
        stateUpdateId,
      },
      trx
    )
    const id2 = await repository.add(
      {
        ...genericRecord,
        assetHashOrId: AssetHash.fake('2'),
        stateUpdateId,
      },
      trx
    )
    const id3 = await repository.add(
      {
        ...genericRecord,
        assetHashOrId: AssetHash.fake('3'),
        stateUpdateId,
      },
      trx
    )
    const id4 = await repository.add(
      {
        ...genericRecord,
        assetHashOrId: AssetHash.fake('4'),
        stateUpdateId,
      },
      trx
    )

    const count = await repository.getCountByStateUpdateId(stateUpdateId, trx)
    expect(count).toEqual(4)

    const page1Records = await repository.getByStateUpdateIdPaginated(
      stateUpdateId,
      { offset: 0, limit: 2 },
      trx
    )
    expect(page1Records.map((r) => r.historyId)).toEqual(
      [id1, id2, id3, id4].sort().slice(0, 2)
    )

    const page2Records = await repository.getByStateUpdateIdPaginated(
      stateUpdateId,
      { offset: 2, limit: 2 },
      trx
    )
    expect(page2Records.map((r) => r.historyId)).toEqual(
      [id1, id2, id3, id4].sort().slice(2, 4)
    )
  })

  it('gets by stark key - paginated and count', async () => {
    const starkKey = StarkKey.fake('000fab')

    const id1 = await repository.add(
      {
        ...genericRecord,
        assetHashOrId: AssetHash.fake('1'),
        starkKey,
        timestamp: Timestamp(900_000_000n),
      },
      trx
    )
    const id2 = await repository.add(
      {
        ...genericRecord,
        assetHashOrId: AssetHash.fake('2'),
        timestamp: Timestamp(800_000_000n),
        starkKey,
      },
      trx
    )
    const id3 = await repository.add(
      {
        ...genericRecord,
        assetHashOrId: AssetHash.fake('3'),
        starkKey,
        timestamp: Timestamp(600_000_000n),
      },
      trx
    )
    const id4 = await repository.add(
      {
        ...genericRecord,
        assetHashOrId: AssetHash.fake('4'),
        starkKey,
        timestamp: Timestamp(700_000_000n),
      },
      trx
    )

    const count = await repository.getCountByStarkKey(starkKey, trx)
    expect(count).toEqual(4)

    const page1Records = await repository.getByStarkKeyPaginated(
      starkKey,
      { offset: 0, limit: 2 },
      trx
    )
    expect(page1Records.map((r) => r.historyId)).toEqual([id1, id2])

    const page2Records = await repository.getByStarkKeyPaginated(
      starkKey,
      { offset: 2, limit: 4 },
      trx
    )
    // Ordered by timestamp!
    expect(page2Records.map((r) => r.historyId)).toEqual([id4, id3])
  })

  it('gets current by stark key - paginated and count, with collateral at top', async () => {
    const starkKey = StarkKey.fake('000fab')
    const collateralAsset = AssetHash.fake('fffff')

    const id1 = await repository.add(
      {
        ...genericRecord,
        assetHashOrId: AssetHash.fake('1'),
        starkKey,
        isCurrent: true,
      },
      trx
    )
    await repository.add(
      {
        ...genericRecord,
        assetHashOrId: AssetHash.fake('2'),
        starkKey,
        isCurrent: false,
      },
      trx
    )
    const id3 = await repository.add(
      {
        ...genericRecord,
        assetHashOrId: AssetHash.fake('4'),
        starkKey,
        isCurrent: true,
      },
      trx
    )
    const id4 = await repository.add(
      {
        ...genericRecord,
        assetHashOrId: AssetHash.fake('3'),
        starkKey,
        isCurrent: true,
      },
      trx
    )
    const idCollateral = await repository.add(
      {
        ...genericRecord,
        assetHashOrId: collateralAsset,
        starkKey,
        isCurrent: true,
      },
      trx
    )

    const count = await repository.getCountOfCurrentByStarkKey(starkKey, trx)
    expect(count).toEqual(4)

    const page1Records = await repository.getCurrentByStarkKeyPaginated(
      starkKey,
      { offset: 0, limit: 2 },
      collateralAsset,
      trx
    )
    expect(page1Records.map((r) => r.historyId)).toEqual([idCollateral, id1])

    const page2Records = await repository.getCurrentByStarkKeyPaginated(
      starkKey,
      { offset: 2, limit: 4 },
      collateralAsset,
      trx
    )
    // Order by hash id desc
    expect(page2Records.map((r) => r.historyId)).toEqual([id4, id3])
  })
})
