import {
  AssetId,
  Hash256,
  PedersenHash,
  StarkKey,
  Timestamp,
} from '@explorer/types'
import { expect } from 'earljs'

import {
  StateUpdateRecord,
  StateUpdateRepository,
} from '../../../src/peripherals/database/StateUpdateRepository'
import { Logger, LogLevel } from '../../../src/tools/Logger'
import { setupDatabaseTestSuite } from './setup'

describe(StateUpdateRepository.name, () => {
  const { knex } = setupDatabaseTestSuite()

  const repository = new StateUpdateRepository(
    knex,
    new Logger({ format: 'pretty', logLevel: LogLevel.ERROR })
  )

  afterEach(() => repository.deleteAll())

  it('adds state update', async () => {
    await repository.add({
      stateUpdate: {
        id: 10_000,
        blockNumber: 10_000,
        rootHash: PedersenHash.fake(),
        factHash: Hash256.fake(),
        timestamp: Timestamp(0),
      },
      positions: [
        {
          starkKey: StarkKey.fake(),
          positionId: 0n,
          collateralBalance: 0n,
          balances: [{ assetId: AssetId('ETH-9'), balance: 20n }],
        },
      ],
      prices: [{ assetId: AssetId('ETH-9'), price: 40n }],
      transactionHashes: [Hash256.fake()],
    })
  })

  it('gets state update id by root hash', async () => {
    const rootHash = PedersenHash.fake()

    await repository.add({
      stateUpdate: {
        id: 1,
        blockNumber: 1,
        rootHash,
        factHash: Hash256.fake(),
        timestamp: Timestamp(0),
      },
      positions: [],
      prices: [],
    })

    await repository.add({
      stateUpdate: {
        id: 2,
        blockNumber: 2,
        rootHash: PedersenHash.fake(),
        factHash: Hash256.fake(),
        timestamp: Timestamp(0),
      },
      positions: [],
      prices: [],
    })

    const result = await repository.findIdByRootHash(rootHash)
    expect(result).toEqual(1)
  })

  it('gets undefined when root hash not found', async () => {
    const rootHash = PedersenHash.fake()

    const position = await repository.findIdByRootHash(rootHash)

    expect(position).toEqual(undefined)
  })

  it('gets all state updates', async () => {
    const stateUpdate: StateUpdateRecord = {
      id: 10_002,
      blockNumber: 10_002,
      rootHash: PedersenHash.fake(),
      factHash: Hash256.fake(),
      timestamp: Timestamp(0),
    }

    await repository.add({ stateUpdate, positions: [], prices: [] })

    expect(await repository.getAll()).toEqual([stateUpdate])
  })

  it('gets last state update by block number', async () => {
    let last = await repository.findLast()

    expect(last).toEqual(undefined)

    for (const blockNumber of [30_001, 30_002, 30_003]) {
      await repository.add({
        stateUpdate: {
          id: blockNumber,
          blockNumber,
          rootHash: PedersenHash.fake(),
          factHash: Hash256.fake(),
          timestamp: Timestamp(0),
        },
        positions: [],
        prices: [],
      })
    }
    const stateUpdate = {
      id: 30_004,
      blockNumber: 30_004,
      rootHash: PedersenHash.fake(),
      factHash: Hash256.fake(),
      timestamp: Timestamp(0),
    }
    await repository.add({ stateUpdate, positions: [], prices: [] })

    last = await repository.findLast()

    expect(last).toEqual(stateUpdate)
  })

  it('deletes all state updates after block number', async () => {
    for (const blockNumber of [20_001, 20_002, 20_003, 20_004]) {
      await repository.add({
        stateUpdate: {
          id: blockNumber,
          blockNumber,
          rootHash: PedersenHash.fake(),
          factHash: Hash256.fake(),
          timestamp: Timestamp(0),
        },
        positions: [
          {
            starkKey: StarkKey.fake(blockNumber.toString()),
            positionId: BigInt(blockNumber),
            collateralBalance: 0n,
            balances: [{ assetId: AssetId('ETH-9'), balance: 20n }],
          },
        ],
        prices: [{ assetId: AssetId('ETH-9'), price: BigInt(blockNumber) }],
      })
    }

    await repository.deleteAfter(20_002)

    const records = await repository.getAll()
    expect(records.map((x) => x.blockNumber)).toEqual([20_001, 20_002])

    expect(await knex('positions').select('public_key')).toEqual([
      { public_key: StarkKey.fake('20001').toString() },
      { public_key: StarkKey.fake('20002').toString() },
    ])
    expect(await knex('prices').select('asset_id', 'price')).toEqual([
      { asset_id: 'ETH-9', price: 20001n },
      { asset_id: 'ETH-9', price: 20002n },
    ])
  })

  it('gets a list of state updates descending by timestamp', async () => {
    for (const blockNumber of [20_001, 20_002, 20_003, 20_004]) {
      await repository.add({
        stateUpdate: {
          id: blockNumber,
          blockNumber,
          rootHash: PedersenHash.fake(blockNumber.toString()),
          factHash: Hash256.fake(),
          timestamp: Timestamp(blockNumber),
        },
        positions: Array.from({ length: blockNumber - 20_000 }).map((_, i) => ({
          starkKey: StarkKey.fake(),
          positionId: BigInt(blockNumber * 10 + i),
          collateralBalance: 0n,
          balances: [],
        })),
        prices: [],
      })
    }
    await repository.add({
      stateUpdate: {
        id: 20_005,
        blockNumber: 20_005,
        rootHash: PedersenHash.fake('20005'),
        factHash: Hash256.fake(),
        timestamp: Timestamp(20_005),
      },
      positions: [],
      prices: [],
    })

    const actual = await repository.getPaginated({ offset: 0, limit: 2 })

    expect(actual).toEqual([
      {
        positionCount: 0,
        rootHash: PedersenHash.fake('20005'),
        timestamp: Timestamp(20_005),
        id: 20_005,
      },
      {
        id: 20_004,
        positionCount: 4,
        rootHash: PedersenHash.fake('20004'),
        timestamp: Timestamp(20_004),
      },
    ])
  })

  it('gets state by its id', async () => {
    const collateralBalance = 100_000_000_000_000n
    const blockNumber = 30_000
    const timestamp = Timestamp(Math.floor(Date.now() / 1000))
    const rootHash = PedersenHash.fake()
    const factHash = Hash256.fake()
    await repository.add({
      stateUpdate: {
        id: blockNumber,
        blockNumber,
        rootHash,
        factHash,
        timestamp,
      },
      positions: Array.from({ length: 4 }).map((_, i) => ({
        starkKey: StarkKey.fake(`${blockNumber}${i}`),
        positionId: BigInt(blockNumber * 10 + i),
        collateralBalance: collateralBalance,
        balances: [{ assetId: AssetId('ETH-9'), balance: 10n }],
      })),
      prices: [{ assetId: AssetId('ETH-9'), price: 10n }],
    })

    const actual = await repository.findByIdWithPositions(blockNumber)

    expect(actual).toEqual({
      id: blockNumber,
      hash: factHash,
      blockNumber,
      rootHash,
      timestamp,
      positions: Array.from({ length: 4 }).map((_, i) =>
        expect.objectWith({
          starkKey: StarkKey.fake(`${blockNumber}${i}`),
          positionId: BigInt(blockNumber * 10 + i),
          collateralBalance: collateralBalance,
          balances: [{ assetId: AssetId('ETH-9'), balance: 10n }],
          prices: [{ assetId: AssetId('ETH-9'), price: 10n }],
        })
      ),
    })
  })

  it('gets a count of all state changes', async () => {
    for (const blockNumber of [40_001, 40_002, 40_003, 40_004]) {
      await repository.add({
        stateUpdate: {
          id: blockNumber,
          blockNumber,
          rootHash: PedersenHash.fake(blockNumber.toString()),
          factHash: Hash256.fake(),
          timestamp: Timestamp(blockNumber),
        },
        positions: Array.from({ length: blockNumber - 40_000 }).map((_, i) => ({
          starkKey: StarkKey.fake(),
          positionId: BigInt(blockNumber * 10 + i),
          collateralBalance: 0n,
          balances: [],
        })),
        prices: [],
      })
    }

    const total = await repository.count()

    expect(total).toEqual(4n)
  })

  it('returns undefined if update is missing', async () => {
    const update = await repository.findByIdWithPositions(1)
    expect(update).not.toBeDefined()
  })
})
