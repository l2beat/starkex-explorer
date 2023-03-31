import {
  AssetId,
  EthereumAddress,
  Hash256,
  PedersenHash,
  StarkKey,
  Timestamp,
} from '@explorer/types'
import { expect } from 'earl'

import { setupDatabaseTestSuite } from '../../test/database'
import { Logger, LogLevel } from '../../tools/Logger'
import { PositionRepository } from './PositionRepository'
import { StateUpdateRepository } from './StateUpdateRepository'
import { UserRegistrationEventRepository } from './UserRegistrationEventRepository'

describe(PositionRepository.name, () => {
  const { database } = setupDatabaseTestSuite()

  const logger = new Logger({ format: 'pretty', logLevel: LogLevel.ERROR })
  const stateUpdateRepository = new StateUpdateRepository(database, logger)
  const positionRepository = new PositionRepository(database, logger)

  before(() => stateUpdateRepository.deleteAll())
  afterEach(() => stateUpdateRepository.deleteAll())

  const mockStateUpdate = (id: number) => ({
    id,
    blockNumber: id * 1000,
    rootHash: PedersenHash.fake(),
    stateTransitionHash: Hash256.fake(),
    timestamp: Timestamp(0),
  })

  const mockPosition = (id: bigint, key = StarkKey.fake()) => ({
    positionId: id,
    starkKey: key,
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

  it('finds position by id', async () => {
    const positionId = 12345n

    await stateUpdateRepository.add({
      stateUpdate: {
        id: 1,
        blockNumber: 1,
        rootHash: PedersenHash.fake(),
        stateTransitionHash: Hash256.fake(),
        timestamp: Timestamp(0),
      },
      positions: [
        {
          starkKey: StarkKey.fake('1'),
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
        stateTransitionHash: Hash256.fake(),
        timestamp: Timestamp(0),
      },
      positions: [
        {
          starkKey: StarkKey.fake('1'),
          positionId,
          collateralBalance: 0n,
          balances: [{ assetId: AssetId('BTC-10'), balance: 40n }],
        },
      ],
      prices: [{ assetId: AssetId('BTC-10'), price: 40n }],
    })

    const position = await positionRepository.findById(positionId)

    expect(position).toEqual({
      starkKey: StarkKey.fake('1'),
      positionId,
      collateralBalance: 0n,
      balances: [{ assetId: AssetId('BTC-10'), balance: 40n }],
      stateUpdateId: 2,
    })
  })

  it('gets positions by state update id', async () => {
    await stateUpdateRepository.add({
      stateUpdate: {
        id: 1,
        blockNumber: 1,
        rootHash: PedersenHash.fake(),
        stateTransitionHash: Hash256.fake(),
        timestamp: Timestamp(0),
      },
      positions: [
        {
          starkKey: StarkKey.fake('1'),
          positionId: 1n,
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
        stateTransitionHash: Hash256.fake(),
        timestamp: Timestamp(0),
      },
      positions: [
        {
          starkKey: StarkKey.fake('1'),
          positionId: 10n,
          collateralBalance: 0n,
          balances: [{ assetId: AssetId('BTC-10'), balance: 40n }],
        },
        {
          starkKey: StarkKey.fake('2'),
          positionId: 20n,
          collateralBalance: 1000n,
          balances: [{ assetId: AssetId('ETH-9'), balance: 80n }],
        },
      ],
      prices: [
        { assetId: AssetId('ETH-9'), price: 20n },
        { assetId: AssetId('BTC-10'), price: 40n },
      ],
    })

    const positions = await positionRepository.getByStateUpdateId(2)

    expect(positions).toEqual([
      {
        starkKey: StarkKey.fake('1'),
        positionId: 10n,
        collateralBalance: 0n,
        balances: [{ assetId: AssetId('BTC-10'), balance: 40n }],
        stateUpdateId: 2,
      },
      {
        starkKey: StarkKey.fake('2'),
        positionId: 20n,
        collateralBalance: 1000n,
        balances: [{ assetId: AssetId('ETH-9'), balance: 80n }],
        stateUpdateId: 2,
      },
    ])
  })

  it('finds history by id', async () => {
    const positionId = 12345n

    await stateUpdateRepository.add({
      stateUpdate: {
        id: 1,
        blockNumber: 1,
        rootHash: PedersenHash.fake(),
        stateTransitionHash: Hash256.fake(),
        timestamp: Timestamp(0),
      },
      positions: [
        {
          starkKey: StarkKey.fake('1'),
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
        stateTransitionHash: Hash256.fake(),
        timestamp: Timestamp(0),
      },
      positions: [
        {
          starkKey: StarkKey.fake('1'),
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
        starkKey: StarkKey.fake('1'),
        positionId,
        collateralBalance: 0n,
        balances: [{ assetId: AssetId('BTC-10'), balance: 40n }],
        prices: [{ assetId: AssetId('BTC-10'), price: 40n }],
        timestamp: Timestamp(0),
      },
      {
        stateUpdateId: 1,
        starkKey: StarkKey.fake('1'),
        positionId,
        collateralBalance: 0n,
        balances: [{ assetId: AssetId('ETH-9'), balance: 20n }],
        prices: [{ assetId: AssetId('ETH-9'), price: 20n }],
        timestamp: Timestamp(0),
      },
    ])
  })

  describe(positionRepository.findIdByStarkKey.name, () => {
    it('finds the id', async () => {
      const positionId = 12345n
      const starkKey = StarkKey.fake()

      await stateUpdateRepository.add({
        stateUpdate: mockStateUpdate(1),
        positions: [mockPosition(positionId, starkKey)],
        prices: [],
      })

      await stateUpdateRepository.add({
        stateUpdate: mockStateUpdate(2),
        positions: [mockPosition(positionId)],
        prices: [],
      })

      const result = await positionRepository.findIdByStarkKey(starkKey)
      expect(result).toEqual(positionId)
    })

    it('returns undefined when not found', async () => {
      const result = await positionRepository.findIdByStarkKey(StarkKey.fake())
      expect(result).toEqual(undefined)
    })
  })

  describe(positionRepository.findIdByEthereumAddress.name, () => {
    const userRegistrationEventRepository = new UserRegistrationEventRepository(
      database,
      logger
    )
    afterEach(() => userRegistrationEventRepository.deleteAll())

    it('finds latest association', async () => {
      await userRegistrationEventRepository.addMany([
        {
          blockNumber: 1,
          ethAddress: EthereumAddress.fake('abc'),
          starkKey: StarkKey.fake('abc'),
        },
        {
          blockNumber: 2,
          ethAddress: EthereumAddress.fake('abc'),
          starkKey: StarkKey.fake('def'),
        },
      ])

      await stateUpdateRepository.add({
        stateUpdate: mockStateUpdate(1),
        positions: [
          mockPosition(12345n, StarkKey.fake('abc')),
          mockPosition(6789n, StarkKey.fake('def')),
        ],
        prices: [],
      })

      const result = await positionRepository.findIdByEthereumAddress(
        EthereumAddress.fake('abc')
      )
      expect(result).toEqual(6789n)
    })

    it('returns undefined when not found', async () => {
      const result = await positionRepository.findIdByEthereumAddress(
        EthereumAddress.fake()
      )
      expect(result).toEqual(undefined)
    })
  })

  describe(positionRepository.findByIdWithPrices.name, () => {
    it('returns latest update', async () => {
      const positionId = 12345n

      await stateUpdateRepository.add({
        stateUpdate: {
          id: 1,
          blockNumber: 1,
          rootHash: PedersenHash.fake(),
          stateTransitionHash: Hash256.fake(),
          timestamp: Timestamp(0),
        },
        positions: [
          {
            starkKey: StarkKey.fake('1'),
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
          stateTransitionHash: Hash256.fake(),
          timestamp: Timestamp(0),
        },
        positions: [
          {
            starkKey: StarkKey.fake('1'),
            positionId,
            collateralBalance: 0n,
            balances: [{ assetId: AssetId('BTC-10'), balance: 40n }],
          },
        ],
        prices: [{ assetId: AssetId('BTC-10'), price: 40n }],
      })

      const position = await positionRepository.findByIdWithPrices(positionId)

      expect(position).toEqual({
        stateUpdateId: 2,
        starkKey: StarkKey.fake('1'),
        positionId,
        collateralBalance: 0n,
        balances: [{ assetId: AssetId('BTC-10'), balance: 40n }],
        prices: [{ assetId: AssetId('BTC-10'), price: 40n }],
      })
    })

    it('returns undefined when not found', async () => {
      const result = await positionRepository.findById(1n)
      expect(result).toEqual(undefined)
    })
  })

  it('gets positions state from previous update', async () => {
    const stateUpdateId = 10
    const nextStateUpdateId = 11
    const positionId = 1n
    await stateUpdateRepository.add({
      stateUpdate: mockStateUpdate(stateUpdateId),
      positions: [
        {
          starkKey: StarkKey.fake(),
          positionId,
          collateralBalance: 10n,
          balances: [{ assetId: AssetId('ETH-9'), balance: 10n }],
        },
      ],
      prices: [{ assetId: AssetId('ETH-9'), price: BigInt(stateUpdateId) }],
    })
    await stateUpdateRepository.add({
      stateUpdate: mockStateUpdate(nextStateUpdateId),
      positions: [
        {
          starkKey: StarkKey.fake(),
          positionId,
          collateralBalance: 20n,
          balances: [{ assetId: AssetId('ETH-9'), balance: 20n }],
        },
        {
          starkKey: StarkKey.fake(),
          positionId: 2n,
          collateralBalance: 30n,
          balances: [{ assetId: AssetId('ETH-9'), balance: 30n }],
        },
      ],
      prices: [{ assetId: AssetId('ETH-9'), price: BigInt(nextStateUpdateId) }],
    })
    const positions = await positionRepository.getPreviousStates(
      [positionId],
      nextStateUpdateId
    )
    expect(positions.length).toEqual(1)
    // TODO: update once earljs supports .toHaveSubset!
    expect(positions[0]).toEqual(
      expect.subset({
        stateUpdateId,
        prices: [{ assetId: AssetId('ETH-9'), price: BigInt(stateUpdateId) }],
        balances: [{ assetId: AssetId('ETH-9'), balance: 10n }],
      })
    )
  })
})
