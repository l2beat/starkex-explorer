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

  const mockStateUpdate = (id: number) => ({
    id,
    blockNumber: id * 1000,
    rootHash: PedersenHash.fake(),
    factHash: Hash256.fake(),
    timestamp: Timestamp(0),
  })

  const mockPosition = (id: bigint, key = StarkKey.fake()) => ({
    positionId: id,
    publicKey: key,
    collateralBalance: 0n,
    balances: [],
  })

  it('counts all positions', async () => {
    await stateUpdateRepository.add({
      stateUpdate: mockStateUpdate(1),
      positions: [mockPosition(123n), mockPosition(456n)],
      prices: [],
    })
    await stateUpdateRepository.add({
      stateUpdate: mockStateUpdate(2),
      positions: [mockPosition(456n), mockPosition(789n)],
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

  describe(positionRepository.findIdByPublicKey.name, () => {
    it('finds the id', async () => {
      const positionId = 12345n
      const publicKey = StarkKey.fake()

      await stateUpdateRepository.add({
        stateUpdate: mockStateUpdate(1),
        positions: [mockPosition(positionId, publicKey)],
        prices: [],
      })

      await stateUpdateRepository.add({
        stateUpdate: mockStateUpdate(2),
        positions: [mockPosition(positionId)],
        prices: [],
      })

      const result = await positionRepository.findIdByPublicKey(publicKey)
      expect(result).toEqual(positionId)
    })

    it('returns undefined when not found', async () => {
      const result = await positionRepository.findIdByPublicKey(StarkKey.fake())
      expect(result).toEqual(undefined)
    })
  })
})
