import { StarkKey, Timestamp } from '@explorer/types'
import { Logger } from '@l2beat/backend-tools'
import { expect, mockFn, mockObject } from 'earl'
import { Knex } from 'knex'
import range from 'lodash/range'
import waitForExpect from 'wait-for-expect'

import { KeyValueStore } from '../../peripherals/database/KeyValueStore'
import { L2TransactionRepository } from '../../peripherals/database/L2TransactionRepository'
import { StateUpdateRepository } from '../../peripherals/database/StateUpdateRepository'
import { LiveL2TransactionClient } from '../../peripherals/starkware/LiveL2TransactionClient'
import {
  PerpetualL2Transaction,
  SuccessfullyParsedL2Transaction,
  UnsuccessfullyParsedL2Transaction,
} from '../../peripherals/starkware/toPerpetualTransactions'
import { Clock } from './Clock'
import { LiveL2TransactionDownloader } from './LiveL2TransactionDownloader'

const fakeL2Transaction = (
  transaction: Partial<SuccessfullyParsedL2Transaction>
): PerpetualL2Transaction => ({
  parsedSuccessfully: true,
  thirdPartyId: 1024,
  transactionId: 2048,
  timestamp: Timestamp(4096),
  transaction: {
    type: 'Deposit',
    positionId: 4096n,
    starkKey: StarkKey.fake(),
    amount: 8196n,
  },
  ...transaction,
})

const fakeParseError: UnsuccessfullyParsedL2Transaction = {
  parsedSuccessfully: false,
  thirdPartyId: 1024,
  parseError: {
    errors: [
      {
        code: 'invalid_type',
        expected: 'object',
        received: 'undefined',
        path: ['tx'],
        message: 'Required',
      },
      {
        code: 'invalid_type',
        expected: 'number',
        received: 'undefined',
        path: ['tx_id'],
        message: 'Required',
      },
    ],
    payload: 'Parse Error payload',
  },
}

describe(LiveL2TransactionDownloader.name, () => {
  describe(LiveL2TransactionDownloader.prototype.start.name, () => {
    it('should initialize, start and sync, logging parse errors', async () => {
      const thirdPartyId = 1200005
      const firstTxs = range(100).map((i) =>
        fakeL2Transaction({ thirdPartyId: thirdPartyId + i + 1 })
      )
      const secondTxs = range(98).map((i) =>
        fakeL2Transaction({ thirdPartyId: thirdPartyId + i + 100 })
      )
      // Sprinkle in a single mis-parsed transaction
      const parseErrorTx = {
        ...fakeParseError,
        thirdPartyId: thirdPartyId + 98 + 100,
      }
      secondTxs.push(parseErrorTx)

      const mockKnexTransaction = mockObject<Knex.Transaction>({})
      const mockClock = mockObject<Clock>({
        onEvery: mockFn((_, cb) => cb()),
      })
      const mockKeyValueStore = mockObject<KeyValueStore>({
        findByKey: mockFn().resolvesTo(thirdPartyId),
        addOrUpdate: mockFn().resolvesTo('lastSyncedThirdPartyId'),
      })
      const mockLiveL2TransactionClient = mockObject<LiveL2TransactionClient>({
        getPerpetualLiveTransactions: mockFn()
          .resolvesToOnce(firstTxs)
          .resolvesToOnce(secondTxs),
      })
      const mockL2TransactionRepository = mockObject<L2TransactionRepository>({
        addLiveTransaction: mockFn().resolvesTo(1),
        runInTransactionWithLockedTable: mockFn(
          async (fun: (trx: Knex.Transaction) => Promise<void>) => {
            await fun(mockKnexTransaction)
          }
        ),
      })
      const mockLogger = Logger.SILENT
      const mockLoggerError = mockFn(
        (_message: string, _parameters?: unknown) => {}
      )
      mockLogger.error = mockLoggerError

      const liveL2TransactionDownloader = new LiveL2TransactionDownloader(
        mockLiveL2TransactionClient,
        mockL2TransactionRepository,
        mockObject<StateUpdateRepository>(),
        mockKeyValueStore,
        mockClock,
        mockObject<Logger>({
          for: () => mockLogger,
        })
        // Logger.SILENT
      )

      await liveL2TransactionDownloader.start()

      expect(mockKeyValueStore.findByKey).toHaveBeenOnlyCalledWith(
        'lastSyncedThirdPartyId'
      )
      expect(liveL2TransactionDownloader.isEnabled).toEqual(true)
      expect(mockClock.onEvery).toHaveBeenOnlyCalledWith(
        '5s',
        expect.a(Function)
      )
      expect(
        mockLiveL2TransactionClient.getPerpetualLiveTransactions
      ).toHaveBeenNthCalledWith(1, thirdPartyId + 1, 100)

      await waitForExpect(() => {
        firstTxs.forEach((tx, i) => {
          if (tx.parsedSuccessfully) {
            expect(
              mockL2TransactionRepository.addLiveTransaction
            ).toHaveBeenNthCalledWith(
              i + 1,
              {
                transactionId: tx.transactionId,
                timestamp: tx.timestamp,
                data: tx.transaction,
              },
              mockKnexTransaction
            )
          }
        })

        expect(mockKeyValueStore.addOrUpdate).toHaveBeenNthCalledWith(
          1,
          {
            key: 'lastSyncedThirdPartyId',
            value: thirdPartyId + firstTxs.length,
          },
          mockKnexTransaction
        )
      })

      expect(
        mockLiveL2TransactionClient.getPerpetualLiveTransactions
      ).toHaveBeenNthCalledWith(2, thirdPartyId + firstTxs.length, 100)
      await waitForExpect(() => {
        secondTxs.forEach((tx, i) => {
          if (tx.parsedSuccessfully) {
            expect(
              mockL2TransactionRepository.addLiveTransaction
            ).toHaveBeenNthCalledWith(
              firstTxs.length + i + 1,
              {
                data: tx.transaction,
                timestamp: tx.timestamp,
                transactionId: tx.transactionId,
              },
              mockKnexTransaction
            )
          } else {
            expect(mockLoggerError).toHaveBeenCalledWith(
              'Error parsing Live L2 Transaction',
              parseErrorTx.parseError
            )
          }
        })

        expect(mockKeyValueStore.addOrUpdate).toHaveBeenNthCalledWith(
          2,
          {
            key: 'lastSyncedThirdPartyId',
            value: thirdPartyId + firstTxs.length + secondTxs.length - 1,
          },
          mockKnexTransaction
        )
      })

      // Called with one exception of parseErrorTx (hence -1)
      expect(
        mockL2TransactionRepository.addLiveTransaction
      ).toHaveBeenCalledTimes(firstTxs.length + secondTxs.length - 1)

      expect(
        mockLiveL2TransactionClient.getPerpetualLiveTransactions
      ).toHaveBeenExhausted()
    })

    it('should not sync if no lastSyncedThirdPartyId in db', async () => {
      const mockL2TransactionRepository = mockObject<L2TransactionRepository>({
        runInTransactionWithLockedTable: mockFn(),
      })
      const mockKeyValueStore = mockObject<KeyValueStore>({
        findByKey: mockFn().resolvesTo(undefined),
      })
      const mockClock = mockObject<Clock>({
        onEvery: mockFn((_, cb) => cb()),
      })

      const liveL2TransactionDownloader = new LiveL2TransactionDownloader(
        mockObject<LiveL2TransactionClient>(),
        mockL2TransactionRepository,
        mockObject<StateUpdateRepository>(),
        mockKeyValueStore,
        mockClock,
        Logger.SILENT
      )

      await liveL2TransactionDownloader.start()

      expect(mockKeyValueStore.findByKey).toHaveBeenOnlyCalledWith(
        'lastSyncedThirdPartyId'
      )
      expect(liveL2TransactionDownloader.isEnabled).toEqual(false)
      expect(mockClock.onEvery).toHaveBeenOnlyCalledWith(
        '5s',
        expect.a(Function)
      )
      expect(
        mockL2TransactionRepository.runInTransactionWithLockedTable
      ).not.toHaveBeenCalled()
    })

    it('should not sync again if already running', async () => {
      const mockL2TransactionRepository = mockObject<L2TransactionRepository>({
        runInTransactionWithLockedTable: mockFn(),
      })
      const mockKeyValueStore = mockObject<KeyValueStore>({
        findByKey: mockFn().resolvesTo(1),
      })
      const mockClock = mockObject<Clock>({
        onEvery: mockFn((_, cb) => cb()),
      })

      const liveL2TransactionDownloader = new LiveL2TransactionDownloader(
        mockObject<LiveL2TransactionClient>(),
        mockL2TransactionRepository,
        mockObject<StateUpdateRepository>(),
        mockKeyValueStore,
        mockClock,
        Logger.SILENT
      )
      liveL2TransactionDownloader.isRunning = true

      await liveL2TransactionDownloader.start()

      expect(mockKeyValueStore.findByKey).toHaveBeenOnlyCalledWith(
        'lastSyncedThirdPartyId'
      )
      expect(liveL2TransactionDownloader.isEnabled).toEqual(true)
      expect(mockClock.onEvery).toHaveBeenOnlyCalledWith(
        '5s',
        expect.a(Function)
      )
      expect(
        mockL2TransactionRepository.runInTransactionWithLockedTable
      ).not.toHaveBeenCalled()
    })
  })

  describe(LiveL2TransactionDownloader.prototype.enableSync.name, () => {
    it('should not do anything if already enabled', async () => {
      const mockStateUpdateRepository = mockObject<StateUpdateRepository>({
        findLast: mockFn(),
      })

      const liveL2TransactionDownloader = new LiveL2TransactionDownloader(
        mockObject<LiveL2TransactionClient>(),
        mockObject<L2TransactionRepository>(),
        mockStateUpdateRepository,
        mockObject<KeyValueStore>(),
        mockObject<Clock>(),
        Logger.SILENT
      )

      liveL2TransactionDownloader.isEnabled = true

      await liveL2TransactionDownloader.enableSync()

      expect(mockStateUpdateRepository.findLast).not.toHaveBeenCalled()
    })

    it('should not do anything if no last state update', async () => {
      const mockStateUpdateRepository = mockObject<StateUpdateRepository>({
        findLast: mockFn().resolvesTo(undefined),
      })
      const mockL2TransactionRepository = mockObject<L2TransactionRepository>({
        findLatestIncluded: mockFn(),
      })

      const liveL2TransactionDownloader = new LiveL2TransactionDownloader(
        mockObject<LiveL2TransactionClient>(),
        mockObject<L2TransactionRepository>(),
        mockStateUpdateRepository,
        mockObject<KeyValueStore>(),
        mockObject<Clock>(),
        Logger.SILENT
      )

      await liveL2TransactionDownloader.enableSync()

      expect(mockStateUpdateRepository.findLast).toHaveBeenCalled()
      expect(
        mockL2TransactionRepository.findLatestIncluded
      ).not.toHaveBeenCalled()
      expect(liveL2TransactionDownloader.isEnabled).toEqual(false)
    })

    it('should not do anything if no last included transaction', async () => {
      const mockStateUpdateRepository = mockObject<StateUpdateRepository>({
        findLast: mockFn().resolvesTo({}),
      })
      const mockL2TransactionRepository = mockObject<L2TransactionRepository>({
        findLatestIncluded: mockFn().resolvesTo(undefined),
      })
      const mockL2TransactionClient = mockObject<LiveL2TransactionClient>({
        getThirdPartyIdByTransactionId: mockFn(),
      })

      const liveL2TransactionDownloader = new LiveL2TransactionDownloader(
        mockObject<LiveL2TransactionClient>(),
        mockL2TransactionRepository,
        mockStateUpdateRepository,
        mockObject<KeyValueStore>(),
        mockObject<Clock>(),
        Logger.SILENT
      )

      await liveL2TransactionDownloader.enableSync()

      expect(mockStateUpdateRepository.findLast).toHaveBeenCalled()
      expect(mockL2TransactionRepository.findLatestIncluded).toHaveBeenCalled()
      expect(
        mockL2TransactionClient.getThirdPartyIdByTransactionId
      ).not.toHaveBeenCalled()
      expect(liveL2TransactionDownloader.isEnabled).toEqual(false)
    })

    it('should not do anything if last state update does not match last included transaction', async () => {
      const mockStateUpdateRepository = mockObject<StateUpdateRepository>({
        findLast: mockFn().resolvesTo({ id: 5 }),
      })
      const mockL2TransactionRepository = mockObject<L2TransactionRepository>({
        findLatestIncluded: mockFn().resolvesTo({ stateUpdateId: 10 }),
      })
      const mockL2TransactionClient = mockObject<LiveL2TransactionClient>({
        getThirdPartyIdByTransactionId: mockFn(),
      })

      const liveL2TransactionDownloader = new LiveL2TransactionDownloader(
        mockObject<LiveL2TransactionClient>(),
        mockL2TransactionRepository,
        mockStateUpdateRepository,
        mockObject<KeyValueStore>(),
        mockObject<Clock>(),
        Logger.SILENT
      )

      await liveL2TransactionDownloader.enableSync()

      expect(mockStateUpdateRepository.findLast).toHaveBeenCalled()
      expect(mockL2TransactionRepository.findLatestIncluded).toHaveBeenCalled()
      expect(
        mockL2TransactionClient.getThirdPartyIdByTransactionId
      ).not.toHaveBeenCalled()
      expect(liveL2TransactionDownloader.isEnabled).toEqual(false)
    })

    it('should not do anything if no last synced third party id returned from api', async () => {
      const stateUpdateId = 5
      const transactionId = 20
      const mockStateUpdateRepository = mockObject<StateUpdateRepository>({
        findLast: mockFn().resolvesTo({ id: stateUpdateId }),
      })
      const mockL2TransactionRepository = mockObject<L2TransactionRepository>({
        findLatestIncluded: mockFn().resolvesTo({
          stateUpdateId,
          transactionId,
        }),
      })
      const mockL2TransactionClient = mockObject<LiveL2TransactionClient>({
        getThirdPartyIdByTransactionId: mockFn().resolvesTo(undefined),
      })
      const mockKeyValueStore = mockObject<KeyValueStore>({
        addOrUpdate: mockFn(),
      })

      const liveL2TransactionDownloader = new LiveL2TransactionDownloader(
        mockL2TransactionClient,
        mockL2TransactionRepository,
        mockStateUpdateRepository,
        mockKeyValueStore,
        mockObject<Clock>(),
        Logger.SILENT
      )

      await liveL2TransactionDownloader.enableSync()

      expect(mockStateUpdateRepository.findLast).toHaveBeenCalled()
      expect(mockL2TransactionRepository.findLatestIncluded).toHaveBeenCalled()
      expect(
        mockL2TransactionClient.getThirdPartyIdByTransactionId
      ).toHaveBeenCalledWith(transactionId)
      expect(mockKeyValueStore.addOrUpdate).not.toHaveBeenCalled()
      expect(liveL2TransactionDownloader.isEnabled).toEqual(false)
    })

    it('should enable sync', async () => {
      const stateUpdateId = 5
      const transactionId = 20
      const thirdPartyId = 200

      const mockStateUpdateRepository = mockObject<StateUpdateRepository>({
        findLast: mockFn().resolvesTo({ id: stateUpdateId }),
      })
      const mockL2TransactionRepository = mockObject<L2TransactionRepository>({
        findLatestIncluded: mockFn().resolvesTo({
          stateUpdateId,
          transactionId,
        }),
      })
      const mockL2TransactionClient = mockObject<LiveL2TransactionClient>({
        getThirdPartyIdByTransactionId: mockFn().resolvesTo(thirdPartyId),
      })
      const mockKeyValueStore = mockObject<KeyValueStore>({
        addOrUpdate: mockFn().resolvesTo('lastSyncedThirdPartyId'),
      })

      const liveL2TransactionDownloader = new LiveL2TransactionDownloader(
        mockL2TransactionClient,
        mockL2TransactionRepository,
        mockStateUpdateRepository,
        mockKeyValueStore,
        mockObject<Clock>(),
        Logger.SILENT
      )

      await liveL2TransactionDownloader.enableSync()

      expect(mockStateUpdateRepository.findLast).toHaveBeenCalled()
      expect(mockL2TransactionRepository.findLatestIncluded).toHaveBeenCalled()
      expect(
        mockL2TransactionClient.getThirdPartyIdByTransactionId
      ).toHaveBeenCalledWith(transactionId)
      expect(mockKeyValueStore.addOrUpdate).toHaveBeenCalledWith(
        {
          key: 'lastSyncedThirdPartyId',
          value: thirdPartyId,
        },
        undefined
      )
      expect(liveL2TransactionDownloader.isEnabled).toEqual(true)
    })
  })
})
