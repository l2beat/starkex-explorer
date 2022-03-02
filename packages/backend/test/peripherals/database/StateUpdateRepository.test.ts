import { AssetId, Hash256, PedersenHash } from '@explorer/types'
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
        timestamp: 0,
      },
      positions: [
        {
          publicKey: 'public-key-0',
          positionId: 0n,
          collateralBalance: 0n,
          balances: [{ assetId: AssetId('ETH-9'), balance: 20n }],
        },
      ],
      prices: [{ assetId: AssetId('ETH-9'), price: 40n }],
    })
  })

  it('gets position by id', async () => {
    const positionId = 12345n

    await repository.add({
      stateUpdate: {
        id: 1,
        blockNumber: 1,
        rootHash: PedersenHash.fake(),
        factHash: Hash256.fake(),
        timestamp: 0,
      },
      positions: [
        {
          publicKey: 'public-key-0',
          positionId,
          collateralBalance: 0n,
          balances: [{ assetId: AssetId('ETH-9'), balance: 20n }],
        },
      ],
      prices: [],
    })

    await repository.add({
      stateUpdate: {
        id: 2,
        blockNumber: 2,
        rootHash: PedersenHash.fake(),
        factHash: Hash256.fake(),
        timestamp: 0,
      },
      positions: [
        {
          publicKey: 'public-key-0',
          positionId,
          collateralBalance: 0n,
          balances: [{ assetId: AssetId('BTC-10'), balance: 40n }],
        },
      ],
      prices: [],
    })

    const position = await repository.getPositionById(positionId)

    expect(position).toEqual([
      {
        stateUpdateId: 2,
        publicKey: 'public-key-0',
        positionId,
        collateralBalance: 0n,
        balances: [{ assetId: AssetId('BTC-10'), balance: 40n }],
      },
      {
        stateUpdateId: 1,
        publicKey: 'public-key-0',
        positionId,
        collateralBalance: 0n,
        balances: [{ assetId: AssetId('ETH-9'), balance: 20n }],
      },
    ])
  })

  it('gets all state updates', async () => {
    const stateUpdate: StateUpdateRecord = {
      id: 10_002,
      blockNumber: 10_002,
      rootHash: PedersenHash.fake(),
      factHash: Hash256.fake(),
      timestamp: 0,
    }

    await repository.add({ stateUpdate, positions: [], prices: [] })

    expect(await repository.getAll()).toEqual([stateUpdate])
  })

  it('gets last state update by block number', async () => {
    let last = await repository.getLast()

    expect(last).toEqual(undefined)

    for (const blockNumber of [30_001, 30_002, 30_003]) {
      await repository.add({
        stateUpdate: {
          id: blockNumber,
          blockNumber,
          rootHash: PedersenHash.fake(),
          factHash: Hash256.fake(),
          timestamp: 0,
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
      timestamp: 0,
    }
    await repository.add({ stateUpdate, positions: [], prices: [] })

    last = await repository.getLast()

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
          timestamp: 0,
        },
        positions: [
          {
            publicKey: `public-key-${blockNumber}`,
            positionId: BigInt(blockNumber),
            collateralBalance: 0n,
            balances: [{ assetId: AssetId('ETH-9'), balance: 20n }],
          },
        ],
        prices: [{ assetId: AssetId('ETH-9'), price: BigInt(blockNumber) }],
      })
    }

    await repository.deleteAllAfter(20_002)

    const records = await repository.getAll()
    expect(records.map((x) => x.blockNumber)).toEqual([20_001, 20_002])

    expect(await knex('positions').select('public_key')).toEqual([
      { public_key: 'public-key-20001' },
      { public_key: 'public-key-20002' },
    ])
    expect(await knex('prices').select('asset_id', 'price')).toEqual([
      { asset_id: 'ETH-9', price: 20001n },
      { asset_id: 'ETH-9', price: 20002n },
    ])
  })

  it('gets a list of state changes descending by timestamp', async () => {
    for (const blockNumber of [20_001, 20_002, 20_003, 20_004]) {
      await repository.add({
        stateUpdate: {
          id: blockNumber,
          blockNumber,
          rootHash: PedersenHash.fake(blockNumber.toString()),
          factHash: Hash256.fake(),
          timestamp: blockNumber,
        },
        positions: Array.from({ length: blockNumber - 20_000 }).map((_, i) => ({
          publicKey: `public-key-${blockNumber}-${i}`,
          positionId: BigInt(blockNumber * 10 + i),
          collateralBalance: 0n,
          balances: [],
        })),
        prices: [],
      })
    }

    const actual = await repository.getStateChangeList({ offset: 1, limit: 2 })

    expect(actual).toEqual([
      {
        positionCount: 3,
        rootHash: PedersenHash(
          '0200030000000000000000000000000000000000000000000000000000000000'
        ),
        timestamp: 20003,
      },
      {
        positionCount: 2,
        rootHash: PedersenHash(
          '0200020000000000000000000000000000000000000000000000000000000000'
        ),
        timestamp: 20002,
      },
    ])
  })

  it('gets state by its root hash', async () => {
    const collateralBalance = 100_000_000_000_000n
    const blockNumber = 30_000
    const timestamp = Math.floor(Date.now() / 1000)
    const rootHash = PedersenHash.fake()
    await repository.add({
      stateUpdate: {
        id: blockNumber,
        blockNumber,
        rootHash,
        factHash: Hash256.fake(),
        timestamp,
      },
      positions: Array.from({ length: 4 }).map((_, i) => ({
        publicKey: `public-key-${blockNumber}-${i}`,
        positionId: BigInt(blockNumber * 10 + i),
        collateralBalance: collateralBalance,
        balances: [],
      })),
      prices: [],
    })

    const actual = await repository.getStateChangeByRootHash(rootHash)

    expect(actual).toEqual({
      timestamp,
      positions: Array.from({ length: 4 }).map((_, i) =>
        expect.objectWith({
          publicKey: `public-key-${blockNumber}-${i}`,
          positionId: BigInt(blockNumber * 10 + i),
          collateralBalance: collateralBalance,
          balances: [],
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
          timestamp: blockNumber,
        },
        positions: Array.from({ length: blockNumber - 40_000 }).map((_, i) => ({
          publicKey: `public-key-${blockNumber}-${i}`,
          positionId: BigInt(blockNumber * 10 + i),
          collateralBalance: 0n,
          balances: [],
        })),
        prices: [],
      })
    }

    const fullCount = await repository.getStateChangeCount()

    expect(fullCount).toEqual(4n)
  })
})
