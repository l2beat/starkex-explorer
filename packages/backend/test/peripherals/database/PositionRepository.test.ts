import {
  AssetId,
  Hash256,
  PedersenHash,
  StarkKey,
  Timestamp,
} from '@explorer/types'
import { expect } from 'earljs'

import { PositionRepository } from '../../../src/peripherals/database/PositionRepository'
import { StateUpdateRepository } from '../../../src/peripherals/database/StateUpdateRepository'
import { Logger, LogLevel } from '../../../src/tools/Logger'
import { setupDatabaseTestSuite } from './setup'

describe(PositionRepository.name, () => {
  const { knex } = setupDatabaseTestSuite()

  const logger = new Logger({ format: 'pretty', logLevel: LogLevel.ERROR })
  const stateUpdateRepository = new StateUpdateRepository(knex, logger)
  const positionRepository = new PositionRepository(knex, logger)

  afterEach(() => stateUpdateRepository.deleteAll())

  it('counts all positions', async () => {
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

  it('finds history by id', async () => {
    const positionId = 12345n

    await stateUpdateRepository.add({
      stateUpdate: {
        id: 1,
        blockNumber: 1,
        rootHash: PedersenHash.fake(),
        factHash: Hash256.fake(),
        timestamp: Timestamp(0),
      },
      positions: [
        {
          publicKey: StarkKey.fake('1'),
          positionId,
          collateralBalance: 0n,
          balances: [{ assetId: AssetId('ETH-9'), balance: 20n }],
        },
      ],
      prices: [{ assetId: AssetId('ETH-9'), price: 20n }],
    })

    await stateUpdateRepository.add({
      stateUpdate: {
        id: 2,
        blockNumber: 2,
        rootHash: PedersenHash.fake(),
        factHash: Hash256.fake(),
        timestamp: Timestamp(0),
      },
      positions: [
        {
          publicKey: StarkKey.fake('1'),
          positionId,
          collateralBalance: 0n,
          balances: [{ assetId: AssetId('BTC-10'), balance: 40n }],
        },
      ],
      prices: [{ assetId: AssetId('BTC-10'), price: 40n }],
    })

    const position = await positionRepository.getHistoryById(positionId)

    expect(position).toEqual([
      {
        stateUpdateId: 2,
        publicKey: StarkKey.fake('1'),
        positionId,
        collateralBalance: 0n,
        balances: [{ assetId: AssetId('BTC-10'), balance: 40n }],
        prices: [{ assetId: AssetId('BTC-10'), price: 40n }],
        timestamp: Timestamp(0),
      },
      {
        stateUpdateId: 1,
        publicKey: StarkKey.fake('1'),
        positionId,
        collateralBalance: 0n,
        balances: [{ assetId: AssetId('ETH-9'), balance: 20n }],
        prices: [{ assetId: AssetId('ETH-9'), price: 20n }],
        timestamp: Timestamp(0),
      },
    ])
  })
})
