import {
  AssetId,
  Hash256,
  PedersenHash,
  StarkKey,
  Timestamp,
} from '@explorer/types'
import { Logger } from '@l2beat/backend-tools'
import { expect } from 'earl'
import range from 'lodash/range'
import { it } from 'mocha'

import { setupDatabaseTestSuite } from '../../test/database'
import {
  decodedFakePerpetualState,
  fakeInt,
  fakeTimestamp,
  fakeWithdrawal,
} from '../../test/fakes'
import { ForcedTransactionRepository } from './ForcedTransactionRepository'
import {
  StateUpdateRecord,
  StateUpdateRepository,
} from './StateUpdateRepository'

describe(StateUpdateRepository.name, () => {
  const { database } = setupDatabaseTestSuite()

  const repository = new StateUpdateRepository(
    database,
    new Logger({ format: 'pretty', logLevel: 'ERROR' })
  )

  afterEach(() => repository.deleteAll())

  describe(StateUpdateRepository.prototype.add.name, () => {
    it('adds state update', async () => {
      await repository.add({
        stateUpdate: {
          id: 10_000,
          batchId: 9_999,
          blockNumber: 10_000,
          rootHash: PedersenHash.fake(),
          stateTransitionHash: Hash256.fake(),
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

      //TODO: add test for this case
    })
  })

  describe(StateUpdateRepository.prototype.update.name, () => {
    it('updates state update', async () => {
      const stateUpdate = {
        id: 10_000,
        batchId: 9_999,
        blockNumber: 10_000,
        rootHash: PedersenHash.fake(),
        stateTransitionHash: Hash256.fake(),
        timestamp: Timestamp(0),
        perpetualState: decodedFakePerpetualState,
      }
      await repository.add({
        stateUpdate,
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

      const stateUpdateUpdateData = {
        id: stateUpdate.id,
        batchId: stateUpdate.batchId + 10,
        blockNumber: stateUpdate.blockNumber + 1,
        rootHash: PedersenHash.fake(),
        stateTransitionHash: Hash256.fake(),
        timestamp: Timestamp(0),
        perpetualState: decodedFakePerpetualState,
      }

      const result = await repository.update(stateUpdateUpdateData)
      const updatedStateUpdate = await repository.findById(stateUpdate.id)

      expect(result).toEqual(1)
      expect(updatedStateUpdate).toEqual(stateUpdateUpdateData)
    })
  })

  describe(StateUpdateRepository.prototype.findIdByRootHash.name, () => {
    it('gets state update id by root hash', async () => {
      const rootHash = PedersenHash.fake()

      await repository.add({
        stateUpdate: {
          id: 1,
          batchId: 0,
          blockNumber: 1,
          rootHash,
          stateTransitionHash: Hash256.fake(),
          timestamp: Timestamp(0),
        },
        positions: [],
        prices: [],
      })

      await repository.add({
        stateUpdate: {
          id: 2,
          batchId: 1,
          blockNumber: 2,
          rootHash: PedersenHash.fake(),
          stateTransitionHash: Hash256.fake(),
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
  })

  describe(StateUpdateRepository.prototype.getAll.name, () => {
    it('gets all state updates', async () => {
      const stateUpdate: StateUpdateRecord = {
        id: 10_002,
        batchId: 10_001,
        blockNumber: 10_002,
        rootHash: PedersenHash.fake(),
        stateTransitionHash: Hash256.fake(),
        timestamp: Timestamp(0),
        perpetualState: decodedFakePerpetualState,
      }

      await repository.add({ stateUpdate, positions: [], prices: [] })

      expect(await repository.getAll()).toEqual([stateUpdate])
    })
  })

  describe(
    StateUpdateRepository.prototype.getPricesByStateUpdateId.name,
    () => {
      it('gets all prices for a given state update', async () => {
        await repository.add({
          stateUpdate: {
            id: 900,
            batchId: 899,
            blockNumber: 10_000,
            rootHash: PedersenHash.fake(),
            stateTransitionHash: Hash256.fake(),
            timestamp: Timestamp(0),
          },
          positions: [
            {
              starkKey: StarkKey.fake('1'),
              positionId: 0n,
              collateralBalance: 0n,
              balances: [{ assetId: AssetId('SOL-7'), balance: 200n }],
            },
          ],
          prices: [{ assetId: AssetId('SOL-7'), price: 10n }],
          transactionHashes: [Hash256.fake()],
        })

        await repository.add({
          stateUpdate: {
            id: 10_000,
            batchId: 9_999,
            blockNumber: 10_000,
            rootHash: PedersenHash.fake(),
            stateTransitionHash: Hash256.fake(),
            timestamp: Timestamp(0),
          },
          positions: [
            {
              starkKey: StarkKey.fake('1'),
              positionId: 0n,
              collateralBalance: 0n,
              balances: [{ assetId: AssetId('ETH-9'), balance: 20n }],
            },
            {
              starkKey: StarkKey.fake('2'),
              positionId: 1n,
              collateralBalance: 100n,
              balances: [{ assetId: AssetId('BTC-10'), balance: 120n }],
            },
          ],
          prices: [
            { assetId: AssetId('ETH-9'), price: 40n },
            { assetId: AssetId('BTC-10'), price: 500n },
          ],
          transactionHashes: [Hash256.fake()],
        })

        const prices = await repository.getPricesByStateUpdateId(10_000)
        expect(prices).toEqual([
          { assetId: AssetId('ETH-9'), price: 40n },
          { assetId: AssetId('BTC-10'), price: 500n },
        ])
      })
    }
  )

  describe(StateUpdateRepository.prototype.findLast.name, () => {
    it('gets last state update by id', async () => {
      let last = await repository.findLast()

      expect(last).toEqual(undefined)

      for (const blockNumber of [30_001, 30_002, 30_003]) {
        await repository.add({
          stateUpdate: {
            id: blockNumber * 1000,
            batchId: blockNumber * 1000 - 1,
            blockNumber,
            rootHash: PedersenHash.fake(),
            stateTransitionHash: Hash256.fake(),
            timestamp: Timestamp(0),
          },
          positions: [],
          prices: [],
        })
      }
      const stateUpdate = {
        id: 30_004_000,
        batchId: 30_004_399,
        blockNumber: 30_004,
        rootHash: PedersenHash.fake(),
        stateTransitionHash: Hash256.fake(),
        timestamp: Timestamp(0),
        perpetualState: decodedFakePerpetualState,
      }
      await repository.add({ stateUpdate, positions: [], prices: [] })

      last = await repository.findLast()

      expect(last).toEqual(stateUpdate)
    })

    it('gets last state update by id even if block number is the same', async () => {
      let last = await repository.findLast()
      expect(last).toEqual(undefined)

      await repository.add({
        stateUpdate: {
          id: 1000,
          batchId: 999,
          blockNumber: 123,
          rootHash: PedersenHash.fake(),
          stateTransitionHash: Hash256.fake(),
          timestamp: Timestamp(0),
        },
        positions: [],
        prices: [],
      })

      await repository.add({
        stateUpdate: {
          id: 1001,
          batchId: 1000,
          blockNumber: 123,
          rootHash: PedersenHash.fake(),
          stateTransitionHash: Hash256.fake(),
          timestamp: Timestamp(0),
        },
        positions: [],
        prices: [],
      })

      last = await repository.findLast()

      expect(last?.id).toEqual(1001)
    })
  })

  describe(
    StateUpdateRepository.prototype.findLastUntilBlockNumber.name,
    () => {
      it('gets last state update by id until given block number', async () => {
        let last = await repository.findLastUntilBlockNumber(30_002)
        expect(last).toEqual(undefined)

        const stateUpdate1 = {
          id: 30_001_000,
          batchId: 30_000_999,
          blockNumber: 30_001,
          rootHash: PedersenHash.fake(),
          stateTransitionHash: Hash256.fake(),
          timestamp: Timestamp(0),
          perpetualState: decodedFakePerpetualState,
        }
        const stateUpdate2 = {
          id: 30_002_000,
          batchId: 30_001_999,
          blockNumber: 30_002,
          rootHash: PedersenHash.fake(),
          stateTransitionHash: Hash256.fake(),
          timestamp: Timestamp(0),
          perpetualState: undefined,
        }
        await repository.add({
          stateUpdate: stateUpdate1,
          positions: [],
          prices: [],
        })
        await repository.add({
          stateUpdate: stateUpdate2,
          positions: [],
          prices: [],
        })

        last = await repository.findLastUntilBlockNumber(30_000)
        expect(last).toEqual(undefined)

        last = await repository.findLastUntilBlockNumber(30_001)
        expect(last).toEqual(stateUpdate1)

        last = await repository.findLastUntilBlockNumber(30_002)
        expect(last).toEqual(stateUpdate2)

        last = await repository.findLastUntilBlockNumber(30_999)
        expect(last).toEqual(stateUpdate2)
      })
    }
  )

  describe(StateUpdateRepository.prototype.findById.name, () => {
    it('find state update by id', async () => {
      let last = await repository.findById(30_002)
      expect(last).toEqual(undefined)

      const stateUpdate1 = {
        id: 30_001_000,
        batchId: 30_000_999,
        blockNumber: 30_001,
        rootHash: PedersenHash.fake(),
        stateTransitionHash: Hash256.fake(),
        timestamp: Timestamp(0),
        perpetualState: decodedFakePerpetualState,
      }
      const stateUpdate2 = {
        id: 30_002_000,
        batchId: 30_001_999,
        blockNumber: 30_002,
        rootHash: PedersenHash.fake(),
        stateTransitionHash: Hash256.fake(),
        timestamp: Timestamp(0),
        perpetualState: undefined,
      }
      await repository.add({
        stateUpdate: stateUpdate1,
        positions: [],
        prices: [],
      })
      await repository.add({
        stateUpdate: stateUpdate2,
        positions: [],
        prices: [],
      })

      last = await repository.findById(30_001_000)

      expect(last).toEqual(stateUpdate1)
    })
  })

  describe(StateUpdateRepository.prototype.deleteAfter.name, () => {
    it('deletes all state updates after block number', async () => {
      for (const blockNumber of [20_001, 20_002, 20_003, 20_004]) {
        await repository.add({
          stateUpdate: {
            id: blockNumber,
            batchId: blockNumber - 1,
            blockNumber,
            rootHash: PedersenHash.fake(),
            stateTransitionHash: Hash256.fake(),
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

      const knex = await database.getKnex()
      expect(await knex('positions').select('stark_key')).toEqual([
        { stark_key: StarkKey.fake('20001').toString() },
        { stark_key: StarkKey.fake('20002').toString() },
      ])
      expect(await knex('prices').select('asset_id', 'price')).toEqual([
        { asset_id: 'ETH-9', price: 20001n },
        { asset_id: 'ETH-9', price: 20002n },
      ])
    })
  })

  describe(StateUpdateRepository.prototype.getPaginated.name, () => {
    it('gets a list of state updates descending by timestamp', async () => {
      for (const blockNumber of [20_001, 20_002, 20_003, 20_004]) {
        await repository.add({
          stateUpdate: {
            id: blockNumber,
            batchId: blockNumber - 1,
            blockNumber,
            rootHash: PedersenHash.fake(blockNumber.toString()),
            stateTransitionHash: Hash256.fake(),
            timestamp: Timestamp(blockNumber),
          },
          positions: range(blockNumber - 20_000).map((_, i) => ({
            starkKey: StarkKey.fake(),
            positionId: BigInt(blockNumber * 10 + i),
            collateralBalance: 0n,
            balances: [],
          })),
          prices: [],
          transactionHashes: [Hash256.fake()],
        })
      }
      await repository.add({
        stateUpdate: {
          id: 20_005,
          batchId: 20_004,
          blockNumber: 20_005,
          rootHash: PedersenHash.fake('20005'),
          stateTransitionHash: Hash256.fake(),
          timestamp: Timestamp(20_005),
        },
        positions: [],
        prices: [],
        transactionHashes: [Hash256.fake()],
      })

      const actual = await repository.getPaginated({ offset: 0, limit: 2 })

      expect(actual).toEqual([
        {
          forcedTransactionsCount: 0,
          positionCount: 0,
          rootHash: PedersenHash.fake('20005'),
          timestamp: Timestamp(20_005),
          id: 20_005,
        },
        {
          forcedTransactionsCount: 0,
          id: 20_004,
          positionCount: 4,
          rootHash: PedersenHash.fake('20004'),
          timestamp: Timestamp(20_004),
        },
      ])
    })

    describe('count forced txs', () => {
      const tx1 = {
        hash: Hash256.fake(),
        data: fakeWithdrawal(),
      }
      const tx2 = {
        hash: Hash256.fake(),
        data: fakeWithdrawal(),
      }
      const tx3 = {
        hash: Hash256.fake(),
        data: fakeWithdrawal(),
      }
      const tx4 = {
        hash: Hash256.fake(),
        data: fakeWithdrawal(),
      }

      const sentAt1 = fakeTimestamp()
      const sentAt2 = fakeTimestamp()
      const sentAt3 = null
      const minedAt3 = fakeTimestamp()
      const blockNumber3 = fakeInt()
      const sentAt4 = Timestamp(1)
      const minedAt4 = Timestamp(2)
      const blockNumber4 = fakeInt()

      beforeEach(async () => {
        const forcedTransactionRepository = new ForcedTransactionRepository(
          database,
          new Logger({ format: 'pretty', logLevel: 'ERROR' })
        )

        await forcedTransactionRepository.add(tx1, sentAt1)
        await forcedTransactionRepository.add(tx2, sentAt2)
        await forcedTransactionRepository.add(
          tx3,
          sentAt3,
          minedAt3,
          blockNumber3
        )
        await forcedTransactionRepository.add(
          tx4,
          sentAt4,
          minedAt4,
          blockNumber4
        )
      })

      it('works properly', async () => {
        for (const blockNumber of [20_001, 20_002, 20_003, 20_004]) {
          await repository.add({
            stateUpdate: {
              id: blockNumber,
              batchId: blockNumber - 1,
              blockNumber,
              rootHash: PedersenHash.fake(blockNumber.toString()),
              stateTransitionHash: Hash256.fake(),
              timestamp: Timestamp(blockNumber),
            },
            positions: range(blockNumber - 20_000).map((i) => ({
              starkKey: StarkKey.fake(),
              positionId: BigInt(blockNumber * 10 + i),
              collateralBalance: 0n,
              balances: [],
            })),
            prices: [],
            transactionHashes: [],
          })
        }
        await repository.add({
          stateUpdate: {
            id: 20_005,
            batchId: 20_004,
            blockNumber: 20_005,
            rootHash: PedersenHash.fake('20005'),
            stateTransitionHash: Hash256.fake(),
            timestamp: Timestamp(20_005),
          },
          positions: [
            {
              starkKey: StarkKey.fake(),
              positionId: BigInt(1n),
              collateralBalance: 0n,
              balances: [],
            },
            {
              starkKey: StarkKey.fake(),
              positionId: BigInt(2n),
              collateralBalance: 0n,
              balances: [],
            },
          ],
          prices: [],
          transactionHashes: [tx1.hash, tx2.hash, tx3.hash],
        })

        const actual = await repository.getPaginated({ offset: 0, limit: 2 })

        expect(actual).toEqual([
          {
            forcedTransactionsCount: 3,
            positionCount: 2,
            rootHash: PedersenHash.fake('20005'),
            timestamp: Timestamp(20_005),
            id: 20_005,
          },
          {
            forcedTransactionsCount: 0,
            id: 20_004,
            positionCount: 4,
            rootHash: PedersenHash.fake('20004'),
            timestamp: Timestamp(20_004),
          },
        ])
      })
    })
  })

  describe(StateUpdateRepository.prototype.count.name, () => {
    it('gets a count of all state changes', async () => {
      for (const blockNumber of [40_001, 40_002, 40_003, 40_004]) {
        await repository.add({
          stateUpdate: {
            id: blockNumber,
            batchId: blockNumber - 1,
            blockNumber,
            rootHash: PedersenHash.fake(blockNumber.toString()),
            stateTransitionHash: Hash256.fake(),
            timestamp: Timestamp(blockNumber),
          },
          positions: range(blockNumber - 40_000).map((_, i) => ({
            starkKey: StarkKey.fake(),
            positionId: BigInt(blockNumber * 10 + i),
            collateralBalance: 0n,
            balances: [],
          })),
          prices: [],
        })
      }

      const total = await repository.count()

      expect(total).toEqual(4)
    })
  })

  describe(StateUpdateRepository.prototype.findByIdWithPositions.name, () => {
    it('returns undefined if update is missing', async () => {
      const update = await repository.findByIdWithPositions(1)
      expect(update).toEqual(undefined)
    })

    it('gets state by its id', async () => {
      const collateralBalance = 100_000_000_000_000n
      const blockNumber = 30_000
      const timestamp = Timestamp(Math.floor(Date.now() / 1000))
      const rootHash = PedersenHash.fake()
      const stateTransitionHash = Hash256.fake()
      await repository.add({
        stateUpdate: {
          id: blockNumber,
          batchId: blockNumber - 1,
          blockNumber,
          rootHash,
          stateTransitionHash,
          timestamp,
        },
        positions: range(4).map((i) => ({
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
        hash: stateTransitionHash,
        blockNumber,
        rootHash,
        timestamp,
        positions: range(4).map((i) =>
          expect.subset({
            starkKey: StarkKey.fake(`${blockNumber}${i}`),
            positionId: BigInt(blockNumber * 10 + i),
            collateralBalance: collateralBalance,
            balances: [{ assetId: AssetId('ETH-9'), balance: 10n }],
            prices: [{ assetId: AssetId('ETH-9'), price: 10n }],
          })
        ),
      })
    })
  })
})
