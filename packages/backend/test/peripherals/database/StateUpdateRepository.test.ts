import { PedersenHash } from '@explorer/crypto'
import { AssetId } from '@explorer/encoding'
import { expect } from 'earljs'

import { Hash256 } from '../../../src/model'
import {
  StateUpdateBundle,
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
          positionId: 0,
          collateralBalance: 0n,
          balances: [{ assetId: AssetId('ETH-9'), balance: 20n }],
        },
      ],
      prices: [{ assetId: AssetId('ETH-9'), price: 40n }],
    })
  })

  it('removes prices and positions connected to state update from database', async () => {
    const updateToRemove: StateUpdateBundle = {
      stateUpdate: {
        id: 10_001,
        blockNumber: 10_001,
        rootHash: PedersenHash.fake(),
        factHash: Hash256.fake(),
        timestamp: 0,
      },
      positions: [
        {
          publicKey: 'public-key-1',
          positionId: 0,
          collateralBalance: 0n,
          balances: [{ assetId: AssetId('ETH-9'), balance: 20n }],
        },
      ],
      prices: [{ assetId: AssetId('ETH-9'), price: 40n }],
    }

    await repository.add(updateToRemove)

    const updateThatWontBeRemoved: StateUpdateBundle = {
      stateUpdate: {
        id: 10_002,
        blockNumber: 10_002,
        rootHash: PedersenHash.fake(),
        factHash: Hash256.fake(),
        timestamp: 0,
      },
      positions: [
        {
          publicKey: 'public-key-1',
          positionId: 0,
          collateralBalance: 0n,
          balances: [{ assetId: AssetId('ETH-9'), balance: 20n }],
        },
      ],
      prices: [{ assetId: AssetId('ETH-9'), price: 40n }],
    }

    await repository.add(updateThatWontBeRemoved)

    await repository.delete(updateToRemove.stateUpdate.id)

    const remainingPrices = await knex('prices').select('*')
    const remainingPositions = await knex('positions').select('*')

    expect(remainingPrices.length).toEqual(
      updateThatWontBeRemoved.positions.length
    )
    expect(remainingPositions.length).toEqual(
      updateThatWontBeRemoved.prices.length
    )
  })

  it('gets position by id', async () => {
    const positionId = 12345

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
        positions: [],
        prices: [],
      })
    }

    await repository.deleteAllAfter(20_002)

    const records = await repository.getAll()
    expect(records.map((x) => x.blockNumber)).toEqual([20_001, 20_002])
  })
})
