import { Hash256, PedersenHash, Timestamp } from '@explorer/types'
import { Logger } from '@l2beat/backend-tools'
import { expect, mockFn, mockObject } from 'earl'
import { Knex } from 'knex'

import { KeyValueStore } from '../../peripherals/database/KeyValueStore'
import { L2TransactionRepository } from '../../peripherals/database/L2TransactionRepository'
import { PreprocessedStateUpdateRepository } from '../../peripherals/database/PreprocessedStateUpdateRepository'
import {
  StateUpdateRecord,
  StateUpdateRepository,
} from '../../peripherals/database/StateUpdateRepository'
import { PerpetualHistoryPreprocessor } from './PerpetualHistoryPreprocessor'
import { Preprocessor, SyncDirection } from './Preprocessor'
import { StateDetailsPreprocessor } from './StateDetailsPreprocessor'
import { UserL2TransactionsStatisticsPreprocessor } from './UserL2TransactionsPreprocessor'
import { UserStatisticsPreprocessor } from './UserStatisticsPreprocessor'

const generateFakeStateUpdate = (
  state_update_id: number
): StateUpdateRecord => ({
  id: state_update_id,
  batchId: state_update_id - 1,
  blockNumber: 10_000 + state_update_id,
  rootHash: PedersenHash.fake(),
  stateTransitionHash: Hash256.fake(),
  timestamp: Timestamp(0),
})

describe(Preprocessor.name, () => {
  describe(Preprocessor.prototype.sync.name, () => {
    it('correctly moves forward and backward', async () => {
      const preprocessor = new Preprocessor(
        mockObject<KeyValueStore>(),
        mockObject<PreprocessedStateUpdateRepository>(),
        mockObject<StateUpdateRepository>(),
        mockObject<PerpetualHistoryPreprocessor>(),
        mockObject<StateDetailsPreprocessor>(),
        mockObject<UserStatisticsPreprocessor>(),
        mockObject<UserL2TransactionsStatisticsPreprocessor>(),
        mockObject<L2TransactionRepository>(),
        Logger.SILENT,
        mockObject<boolean>()
      )

      const directions: SyncDirection[] = [
        'forward',
        'forward',
        'backward',
        'forward',
        'backward',
        'backward',
      ]
      let index = 0
      preprocessor.calculateRequiredSyncDirection = async () => {
        return directions[index++] ?? 'stop'
      }

      const actualCalls: SyncDirection[] = []
      preprocessor.preprocessNextStateUpdate = async () => {
        actualCalls.push('forward')
      }
      preprocessor.rollbackOneStateUpdate = async () => {
        actualCalls.push('backward')
      }

      await preprocessor.sync()
      expect(actualCalls).toEqual(directions)
    })
  })

  describe(Preprocessor.prototype.catchUp.name, () => {
    it('catches up', async () => {
      const mockKnexTransaction = mockObject<Knex.Transaction>()
      const lastPreprocessedStateUpdateId = 10
      const mockUserStatisticsPreprocessor =
        mockObject<UserStatisticsPreprocessor>({
          catchUp: mockFn().resolvesTo(undefined),
        })
      const mockUserL2TransactionsPreprocessor =
        mockObject<UserL2TransactionsStatisticsPreprocessor>({
          catchUp: mockFn().resolvesTo(undefined),
        })
      const mockStateDetailsPreprocessor = mockObject<StateDetailsPreprocessor>(
        {
          catchUpL2Transactions: mockFn().resolvesTo(undefined),
        }
      )

      const mockPreprocessedStateUpdateRepository =
        mockObject<PreprocessedStateUpdateRepository>({
          findLast: mockFn().resolvesTo({
            stateUpdateId: lastPreprocessedStateUpdateId,
          }),
          runInTransaction: mockFn(async (fn) => fn(mockKnexTransaction)),
        })

      const preprocessor = new Preprocessor(
        mockObject<KeyValueStore>(),
        mockPreprocessedStateUpdateRepository,
        mockObject<StateUpdateRepository>(),
        mockObject<PerpetualHistoryPreprocessor>(),
        mockStateDetailsPreprocessor,
        mockUserStatisticsPreprocessor,
        mockUserL2TransactionsPreprocessor,
        mockObject<L2TransactionRepository>(),
        Logger.SILENT,
        mockObject<boolean>()
      )

      await preprocessor.catchUp()

      expect(
        mockPreprocessedStateUpdateRepository.runInTransaction
      ).toHaveBeenCalled()
      expect(
        mockPreprocessedStateUpdateRepository.findLast
      ).toHaveBeenCalledWith(mockKnexTransaction)

      expect(mockUserStatisticsPreprocessor.catchUp).toHaveBeenCalledWith(
        mockKnexTransaction,
        lastPreprocessedStateUpdateId
      )
      expect(
        mockStateDetailsPreprocessor.catchUpL2Transactions
      ).toHaveBeenCalledWith(mockKnexTransaction, lastPreprocessedStateUpdateId)
      expect(mockUserStatisticsPreprocessor.catchUp).toHaveBeenCalledWith(
        mockKnexTransaction,
        lastPreprocessedStateUpdateId
      )
    })

    it('does nothing when there is nothing to catch up', async () => {
      const mockKnexTransaction = mockObject<Knex.Transaction>()
      const mockPreprocessedStateUpdateRepository =
        mockObject<PreprocessedStateUpdateRepository>({
          findLast: mockFn().resolvesTo(undefined),
          runInTransaction: mockFn(async (fn) => fn(mockKnexTransaction)),
        })

      const mockUserStatisticsPreprocessor =
        mockObject<UserStatisticsPreprocessor>({
          catchUp: mockFn(),
        })
      const mockUserL2TransactionsPreprocessor =
        mockObject<UserL2TransactionsStatisticsPreprocessor>({
          catchUp: mockFn(),
        })
      const mockStateDetailsPreprocessor = mockObject<StateDetailsPreprocessor>(
        {
          catchUpL2Transactions: mockFn(),
        }
      )

      const preprocessor = new Preprocessor(
        mockObject<KeyValueStore>(),
        mockPreprocessedStateUpdateRepository,
        mockObject<StateUpdateRepository>(),
        mockObject<PerpetualHistoryPreprocessor>(),
        mockStateDetailsPreprocessor,
        mockUserStatisticsPreprocessor,
        mockUserL2TransactionsPreprocessor,
        mockObject<L2TransactionRepository>(),
        Logger.SILENT,
        mockObject<boolean>()
      )

      await preprocessor.catchUp()

      expect(
        mockPreprocessedStateUpdateRepository.runInTransaction
      ).toHaveBeenCalled()
      expect(
        mockPreprocessedStateUpdateRepository.findLast
      ).toHaveBeenCalledWith(mockKnexTransaction)

      expect(mockUserStatisticsPreprocessor.catchUp).not.toHaveBeenCalled()
      expect(
        mockStateDetailsPreprocessor.catchUpL2Transactions
      ).not.toHaveBeenCalled()
      expect(mockUserStatisticsPreprocessor.catchUp).not.toHaveBeenCalled()
    })
  })

  describe(Preprocessor.prototype.getLastSyncedStateUpdate.name, () => {
    it('handles sync status returning undefined', async () => {
      const mockKeyValueStore = mockObject<KeyValueStore>({
        findByKey: async () => undefined,
      })
      const preprocessor = new Preprocessor(
        mockKeyValueStore,
        mockObject<PreprocessedStateUpdateRepository>(),
        mockObject<StateUpdateRepository>(),
        mockObject<PerpetualHistoryPreprocessor>(),
        mockObject<StateDetailsPreprocessor>(),
        mockObject<UserStatisticsPreprocessor>(),
        mockObject<UserL2TransactionsStatisticsPreprocessor>(),
        mockObject<L2TransactionRepository>(),
        Logger.SILENT,
        mockObject<boolean>()
      )

      expect(await preprocessor.getLastSyncedStateUpdate()).toEqual(undefined)
      expect(mockKeyValueStore.findByKey).toHaveBeenOnlyCalledWith(
        'lastBlockNumberSynced'
      )
    })

    it('calls state update repository for correct block', async () => {
      const fakeStateUpdate = generateFakeStateUpdate(3)
      const mockKeyValueStore = mockObject<KeyValueStore>({
        findByKey: mockFn().resolvesTo(fakeStateUpdate.blockNumber),
      })
      const stateUpdateRepo = mockObject<StateUpdateRepository>({
        findLastUntilBlockNumber: async () => fakeStateUpdate,
      })
      const preprocessor = new Preprocessor(
        mockKeyValueStore,
        mockObject<PreprocessedStateUpdateRepository>(),
        stateUpdateRepo,
        mockObject<PerpetualHistoryPreprocessor>(),
        mockObject<StateDetailsPreprocessor>(),
        mockObject<UserStatisticsPreprocessor>(),
        mockObject<UserL2TransactionsStatisticsPreprocessor>(),
        mockObject<L2TransactionRepository>(),
        Logger.SILENT,
        mockObject<boolean>()
      )
      const lastStateUpdate = await preprocessor.getLastSyncedStateUpdate()
      expect(lastStateUpdate).toEqual(fakeStateUpdate)
      expect(mockKeyValueStore.findByKey).toHaveBeenOnlyCalledWith(
        'lastBlockNumberSynced'
      )
      expect(stateUpdateRepo.findLastUntilBlockNumber).toHaveBeenOnlyCalledWith(
        fakeStateUpdate.blockNumber
      )
    })
  })

  describe(Preprocessor.prototype.calculateRequiredSyncDirection.name, () => {
    it('returns not-needed when everything is empty', async () => {
      const preprocessedRepo = mockObject<PreprocessedStateUpdateRepository>({
        findLast: async () => undefined,
      })
      const preprocessor = new Preprocessor(
        mockObject<KeyValueStore>(),
        preprocessedRepo,
        mockObject<StateUpdateRepository>(),
        mockObject<PerpetualHistoryPreprocessor>(),
        mockObject<StateDetailsPreprocessor>(),
        mockObject<UserStatisticsPreprocessor>(),
        mockObject<UserL2TransactionsStatisticsPreprocessor>(),
        mockObject<L2TransactionRepository>(),
        Logger.SILENT,
        mockObject<boolean>()
      )
      const mockGetLastSyncedStateUpdate = mockFn().resolvesTo(undefined)
      preprocessor.getLastSyncedStateUpdate = mockGetLastSyncedStateUpdate
      expect(await preprocessor.calculateRequiredSyncDirection()).toEqual(
        'stop'
      )
      expect(mockGetLastSyncedStateUpdate).toHaveBeenCalled()
    })

    it('returns backward when there are no state updates but preprocessing has entries', async () => {
      const preprocessedRepo = mockObject<PreprocessedStateUpdateRepository>({
        findLast: async () => ({
          stateUpdateId: 3,
          stateTransitionHash: Hash256.fake(),
        }),
      })
      const preprocessor = new Preprocessor(
        mockObject<KeyValueStore>(),
        preprocessedRepo,
        mockObject<StateUpdateRepository>(),
        mockObject<PerpetualHistoryPreprocessor>(),
        mockObject<StateDetailsPreprocessor>(),
        mockObject<UserStatisticsPreprocessor>(),
        mockObject<UserL2TransactionsStatisticsPreprocessor>(),
        mockObject<L2TransactionRepository>(),
        Logger.SILENT,
        mockObject<boolean>()
      )
      const mockGetLastSyncedStateUpdate = mockFn().resolvesTo(undefined)
      preprocessor.getLastSyncedStateUpdate = mockGetLastSyncedStateUpdate

      expect(await preprocessor.calculateRequiredSyncDirection()).toEqual(
        'backward'
      )
      expect(mockGetLastSyncedStateUpdate).toHaveBeenCalled()
    })

    it('returns forward when there are state updates but preprocessing has no entries', async () => {
      const fakeStateUpdate = generateFakeStateUpdate(3)

      const stateUpdateRepo = mockObject<StateUpdateRepository>({
        findLastUntilBlockNumber: async () => fakeStateUpdate,
      })
      const preprocessedRepo = mockObject<PreprocessedStateUpdateRepository>({
        findLast: async () => undefined,
      })
      const preprocessor = new Preprocessor(
        mockObject<KeyValueStore>(),
        preprocessedRepo,
        stateUpdateRepo,
        mockObject<PerpetualHistoryPreprocessor>(),
        mockObject<StateDetailsPreprocessor>(),
        mockObject<UserStatisticsPreprocessor>(),
        mockObject<UserL2TransactionsStatisticsPreprocessor>(),
        mockObject<L2TransactionRepository>(),
        Logger.SILENT,
        mockObject<boolean>()
      )
      const mockGetLastSyncedStateUpdate = mockFn().resolvesTo(fakeStateUpdate)
      preprocessor.getLastSyncedStateUpdate = mockGetLastSyncedStateUpdate

      expect(await preprocessor.calculateRequiredSyncDirection()).toEqual(
        'forward'
      )
      expect(mockGetLastSyncedStateUpdate).toHaveBeenCalled()
    })

    it('returns backward when state update id is before preprocessing', async () => {
      const fakeStateUpdate = generateFakeStateUpdate(2)
      const stateUpdateRepo = mockObject<StateUpdateRepository>({
        findLastUntilBlockNumber: async () => fakeStateUpdate,
      })
      const preprocessedRepo = mockObject<PreprocessedStateUpdateRepository>({
        findLast: async () => ({
          stateUpdateId: fakeStateUpdate.id + 1,
          stateTransitionHash: Hash256.fake(),
        }),
      })
      const preprocessor = new Preprocessor(
        mockObject<KeyValueStore>(),
        preprocessedRepo,
        stateUpdateRepo,
        mockObject<PerpetualHistoryPreprocessor>(),
        mockObject<StateDetailsPreprocessor>(),
        mockObject<UserStatisticsPreprocessor>(),
        mockObject<UserL2TransactionsStatisticsPreprocessor>(),
        mockObject<L2TransactionRepository>(),
        Logger.SILENT,
        mockObject<boolean>()
      )
      const mockGetLastSyncedStateUpdate = mockFn().resolvesTo(fakeStateUpdate)
      preprocessor.getLastSyncedStateUpdate = mockGetLastSyncedStateUpdate

      expect(await preprocessor.calculateRequiredSyncDirection()).toEqual(
        'backward'
      )
      expect(mockGetLastSyncedStateUpdate).toHaveBeenCalled()
    })

    it("throws when the are more state updates but can't find preprocessed id", async () => {
      const fakeStateUpdate = generateFakeStateUpdate(10)
      const stateUpdateRepo = mockObject<StateUpdateRepository>({
        findById: async () => undefined,
        findLastUntilBlockNumber: async () => fakeStateUpdate,
      })
      const preprocessedRepo = mockObject<PreprocessedStateUpdateRepository>({
        findLast: async () => ({
          stateUpdateId: fakeStateUpdate.id - 1,
          stateTransitionHash: Hash256.fake(),
        }),
      })
      const preprocessor = new Preprocessor(
        mockObject<KeyValueStore>(),
        preprocessedRepo,
        stateUpdateRepo,
        mockObject<PerpetualHistoryPreprocessor>(),
        mockObject<StateDetailsPreprocessor>(),
        mockObject<UserStatisticsPreprocessor>(),
        mockObject<UserL2TransactionsStatisticsPreprocessor>(),
        mockObject<L2TransactionRepository>(),
        Logger.SILENT,
        mockObject<boolean>()
      )
      const mockGetLastSyncedStateUpdate = mockFn().resolvesTo(fakeStateUpdate)
      preprocessor.getLastSyncedStateUpdate = mockGetLastSyncedStateUpdate

      await expect(
        preprocessor.calculateRequiredSyncDirection()
      ).toBeRejectedWith(
        'Missing expected state update during Preprocessor sync'
      )
      expect(mockGetLastSyncedStateUpdate).toHaveBeenCalled()
    })

    it('returns not-needed when last state update ids and transition hashes match', async () => {
      const fakeStateUpdate = generateFakeStateUpdate(10)
      const stateUpdateRepo = mockObject<StateUpdateRepository>({
        findById: async (id: number) => ({ [10]: fakeStateUpdate }[id]),
        findLastUntilBlockNumber: async () => fakeStateUpdate,
      })
      const preprocessedRepo = mockObject<PreprocessedStateUpdateRepository>({
        findLast: async () => ({
          stateUpdateId: fakeStateUpdate.id,
          stateTransitionHash: fakeStateUpdate.stateTransitionHash,
        }),
      })
      const preprocessor = new Preprocessor(
        mockObject<KeyValueStore>(),
        preprocessedRepo,
        stateUpdateRepo,
        mockObject<PerpetualHistoryPreprocessor>(),
        mockObject<StateDetailsPreprocessor>(),
        mockObject<UserStatisticsPreprocessor>(),
        mockObject<UserL2TransactionsStatisticsPreprocessor>(),
        mockObject<L2TransactionRepository>(),
        Logger.SILENT,
        mockObject<boolean>()
      )
      const mockGetLastSyncedStateUpdate = mockFn().resolvesTo(fakeStateUpdate)
      preprocessor.getLastSyncedStateUpdate = mockGetLastSyncedStateUpdate

      expect(await preprocessor.calculateRequiredSyncDirection()).toEqual(
        'stop'
      )
      expect(mockGetLastSyncedStateUpdate).toHaveBeenCalled()
    })

    // This can happen when there was a reorg and then a few more state updates were added
    it('returns backward when last state update ids match but transition hash is mismatched', async () => {
      const fakeStateUpdate = generateFakeStateUpdate(10)
      const stateUpdateRepo = mockObject<StateUpdateRepository>({
        findById: async (id: number) => ({ [10]: fakeStateUpdate }[id]),
        findLastUntilBlockNumber: async () => fakeStateUpdate,
      })
      const preprocessedRepo = mockObject<PreprocessedStateUpdateRepository>({
        findLast: async () => ({
          stateUpdateId: fakeStateUpdate.id,
          stateTransitionHash: Hash256.fake(),
        }),
      })
      const preprocessor = new Preprocessor(
        mockObject<KeyValueStore>(),
        preprocessedRepo,
        stateUpdateRepo,
        mockObject<PerpetualHistoryPreprocessor>(),
        mockObject<StateDetailsPreprocessor>(),
        mockObject<UserStatisticsPreprocessor>(),
        mockObject<UserL2TransactionsStatisticsPreprocessor>(),
        mockObject<L2TransactionRepository>(),
        Logger.SILENT,
        mockObject<boolean>()
      )
      const mockGetLastSyncedStateUpdate = mockFn().resolvesTo(fakeStateUpdate)
      preprocessor.getLastSyncedStateUpdate = mockGetLastSyncedStateUpdate

      expect(await preprocessor.calculateRequiredSyncDirection()).toEqual(
        'backward'
      )
      expect(mockGetLastSyncedStateUpdate).toHaveBeenCalled()
    })

    // This can happen when there was a reorg and then a few more state updates were added
    it('returns backward when state is ahead of preprocessing but current transition hash is mismatched', async () => {
      const fakeStateUpdate5 = generateFakeStateUpdate(5)
      const fakeStateUpdate10 = generateFakeStateUpdate(10)
      const stateUpdateRepo = mockObject<StateUpdateRepository>({
        findById: async (id: number) => ({ [5]: fakeStateUpdate5 }[id]),
        findLastUntilBlockNumber: async () => fakeStateUpdate10,
      })
      const preprocessedRepo = mockObject<PreprocessedStateUpdateRepository>({
        findLast: async () => ({
          stateUpdateId: 5,
          stateTransitionHash: Hash256.fake(),
        }),
      })
      const preprocessor = new Preprocessor(
        mockObject<KeyValueStore>(),
        preprocessedRepo,
        stateUpdateRepo,
        mockObject<PerpetualHistoryPreprocessor>(),
        mockObject<StateDetailsPreprocessor>(),
        mockObject<UserStatisticsPreprocessor>(),
        mockObject<UserL2TransactionsStatisticsPreprocessor>(),
        mockObject<L2TransactionRepository>(),
        Logger.SILENT,
        mockObject<boolean>()
      )
      const mockGetLastSyncedStateUpdate =
        mockFn().resolvesTo(fakeStateUpdate10)
      preprocessor.getLastSyncedStateUpdate = mockGetLastSyncedStateUpdate

      expect(await preprocessor.calculateRequiredSyncDirection()).toEqual(
        'backward'
      )
      expect(mockGetLastSyncedStateUpdate).toHaveBeenCalled()
    })

    it('returns forward when state is ahead and current transition hash matches', async () => {
      const fakeStateUpdate5 = generateFakeStateUpdate(5)
      const fakeStateUpdate10 = generateFakeStateUpdate(10)

      const stateUpdateRepo = mockObject<StateUpdateRepository>({
        findById: async (id: number) => ({ [5]: fakeStateUpdate5 }[id]),
        findLastUntilBlockNumber: async () => fakeStateUpdate10,
      })
      const preprocessedRepo = mockObject<PreprocessedStateUpdateRepository>({
        findLast: async () => ({
          stateUpdateId: 5,
          stateTransitionHash: fakeStateUpdate5.stateTransitionHash,
        }),
      })
      const preprocessor = new Preprocessor(
        mockObject<KeyValueStore>(),
        preprocessedRepo,
        stateUpdateRepo,
        mockObject<PerpetualHistoryPreprocessor>(),
        mockObject<StateDetailsPreprocessor>(),
        mockObject<UserStatisticsPreprocessor>(),
        mockObject<UserL2TransactionsStatisticsPreprocessor>(),
        mockObject<L2TransactionRepository>(),
        Logger.SILENT,
        mockObject<boolean>()
      )
      const mockGetLastSyncedStateUpdate =
        mockFn().resolvesTo(fakeStateUpdate10)
      preprocessor.getLastSyncedStateUpdate = mockGetLastSyncedStateUpdate

      expect(await preprocessor.calculateRequiredSyncDirection()).toEqual(
        'forward'
      )
      expect(mockGetLastSyncedStateUpdate).toHaveBeenCalled()
    })
  })

  describe(Preprocessor.prototype.preprocessNextStateUpdate.name, () => {
    const l2TransactionsEnabledValues = [false, true]
    l2TransactionsEnabledValues.forEach((l2TransactionsEnabled) => {
      it(`correctly updates preprocessedStateUpdateRepository in SQL transaction for l2TransactionsEnabled=${l2TransactionsEnabled.toString()}`, async () => {
        const preprocessL2TransactionTo = 200
        const fakeStateUpdate1 = generateFakeStateUpdate(1)
        const fakeStateUpdate2 = generateFakeStateUpdate(2)
        const mockKnexTransaction = mockObject<Knex.Transaction>()
        const mockPerpetualHistoryPreprocessor =
          mockObject<PerpetualHistoryPreprocessor>({
            preprocessNextStateUpdate: async () => undefined,
          })
        const mockStateDetailsPreprocessor =
          mockObject<StateDetailsPreprocessor>({
            preprocessNextStateUpdate: async () => undefined,
            catchUpL2Transactions: mockFn(async () => {}),
          })
        const mockUserStatisticsPreprocessor =
          mockObject<UserStatisticsPreprocessor>({
            preprocessNextStateUpdate: async () => undefined,
          })
        const mockUserL2TransactionsPreprocessor =
          mockObject<UserL2TransactionsStatisticsPreprocessor>({
            catchUp: mockFn(async () => {}),
          })
        const stateUpdateRepo = mockObject<StateUpdateRepository>({
          findById: async (id: number) => ({ [2]: fakeStateUpdate2 }[id]),
        })
        const preprocessedRepo = mockObject<PreprocessedStateUpdateRepository>({
          findLast: async () => ({
            stateUpdateId: fakeStateUpdate1.id,
            stateTransitionHash: fakeStateUpdate1.stateTransitionHash,
          }),
          add: async () => 0,
          runInTransaction: async (fn) => fn(mockKnexTransaction),
        })
        const preprocessor = new Preprocessor(
          mockObject<KeyValueStore>(),
          preprocessedRepo,
          stateUpdateRepo,
          mockPerpetualHistoryPreprocessor,
          mockStateDetailsPreprocessor,
          mockUserStatisticsPreprocessor,
          mockUserL2TransactionsPreprocessor,
          mockObject<L2TransactionRepository>(),
          Logger.SILENT,
          l2TransactionsEnabled
        )

        const mockedGetStateUpdateIdToCatchUpL2TransactionsTo =
          mockFn().resolvesTo(preprocessL2TransactionTo)
        preprocessor.getStateUpdateIdToCatchUpL2TransactionsTo =
          mockedGetStateUpdateIdToCatchUpL2TransactionsTo

        await preprocessor.preprocessNextStateUpdate()
        expect(preprocessedRepo.add).toHaveBeenOnlyCalledWith(
          {
            stateUpdateId: fakeStateUpdate2.id,
            stateTransitionHash: fakeStateUpdate2.stateTransitionHash,
          },
          mockKnexTransaction
        )
        expect(
          mockPerpetualHistoryPreprocessor.preprocessNextStateUpdate
        ).toHaveBeenOnlyCalledWith(mockKnexTransaction, fakeStateUpdate2)
        expect(
          mockStateDetailsPreprocessor.preprocessNextStateUpdate
        ).toHaveBeenOnlyCalledWith(mockKnexTransaction, fakeStateUpdate2)
        expect(
          mockUserStatisticsPreprocessor.preprocessNextStateUpdate
        ).toHaveBeenOnlyCalledWith(mockKnexTransaction, fakeStateUpdate2)

        if (l2TransactionsEnabled) {
          expect(
            mockedGetStateUpdateIdToCatchUpL2TransactionsTo
          ).toHaveBeenCalledWith(mockKnexTransaction, fakeStateUpdate2.id)
          expect(
            mockStateDetailsPreprocessor.catchUpL2Transactions
          ).toHaveBeenOnlyCalledWith(
            mockKnexTransaction,
            preprocessL2TransactionTo
          )
          expect(
            mockUserL2TransactionsPreprocessor.catchUp
          ).toHaveBeenOnlyCalledWith(
            mockKnexTransaction,
            preprocessL2TransactionTo
          )
        }
      })
    })

    it('throws when next state update is missing', async () => {
      const fakeStateUpdate2 = generateFakeStateUpdate(2)
      const mockKnexTransaction = mockObject<Knex.Transaction>()
      const stateUpdateRepo = mockObject<StateUpdateRepository>({
        findById: async (id: number) => ({ [2]: fakeStateUpdate2 }[id]),
      })
      const preprocessedRepo = mockObject<PreprocessedStateUpdateRepository>({
        findLast: async () => ({
          stateUpdateId: fakeStateUpdate2.id,
          stateTransitionHash: fakeStateUpdate2.stateTransitionHash,
        }),
        add: async () => 0,
        runInTransaction: async (fn) => fn(mockKnexTransaction),
      })
      const preprocessor = new Preprocessor(
        mockObject<KeyValueStore>(),
        preprocessedRepo,
        stateUpdateRepo,
        mockObject<PerpetualHistoryPreprocessor>(),
        mockObject<StateDetailsPreprocessor>(),
        mockObject<UserStatisticsPreprocessor>(),
        mockObject<UserL2TransactionsStatisticsPreprocessor>(),
        mockObject<L2TransactionRepository>(),
        Logger.SILENT,
        mockObject<boolean>()
      )
      await expect(preprocessor.preprocessNextStateUpdate()).toBeRejectedWith(
        'Preprocessing was requested, but next state update (3) is missing'
      )
    })
  })

  describe(Preprocessor.prototype.rollbackOneStateUpdate.name, () => {
    const l2TransactionsEnabledValues = [false, true]
    l2TransactionsEnabledValues.forEach((l2TransactionsEnabled) => {
      it(`correctly updates preprocessedStateUpdateRepository in SQL transaction if l2TransactionsEnabled=${l2TransactionsEnabled.toString()}`, async () => {
        const fakeStateUpdate = generateFakeStateUpdate(2)
        const mockKnexTransaction = mockObject<Knex.Transaction>()
        const mockPerpetualHistoryPreprocessor =
          mockObject<PerpetualHistoryPreprocessor>({
            rollbackOneStateUpdate: async () => undefined,
          })
        const mockStateDetailsPreprocessor =
          mockObject<StateDetailsPreprocessor>({
            rollbackOneStateUpdate: async () => undefined,
          })
        const mockUserStatisticsPreprocessor =
          mockObject<UserStatisticsPreprocessor>({
            rollbackOneStateUpdate: async () => undefined,
          })
        const preprocessedRepo = mockObject<PreprocessedStateUpdateRepository>({
          findLast: async () => ({
            stateUpdateId: fakeStateUpdate.id,
            stateTransitionHash: fakeStateUpdate.stateTransitionHash,
          }),
          runInTransaction: async (fn) => fn(mockKnexTransaction),
          deleteByStateUpdateId: async () => 1,
        })
        const mockUserL2TransactionsPreprocessor =
          mockObject<UserL2TransactionsStatisticsPreprocessor>({
            rollbackOneStateUpdate: mockFn().resolvesTo(undefined),
          })
        const preprocessor = new Preprocessor(
          mockObject<KeyValueStore>(),
          preprocessedRepo,
          mockObject<StateUpdateRepository>(),
          mockPerpetualHistoryPreprocessor,
          mockStateDetailsPreprocessor,
          mockUserStatisticsPreprocessor,
          mockUserL2TransactionsPreprocessor,
          mockObject<L2TransactionRepository>(),
          Logger.SILENT,
          l2TransactionsEnabled
        )
        await preprocessor.rollbackOneStateUpdate()
        expect(preprocessedRepo.deleteByStateUpdateId).toHaveBeenOnlyCalledWith(
          fakeStateUpdate.id,
          mockKnexTransaction
        )
        expect(
          mockPerpetualHistoryPreprocessor.rollbackOneStateUpdate
        ).toHaveBeenOnlyCalledWith(mockKnexTransaction, fakeStateUpdate.id)
        expect(
          mockStateDetailsPreprocessor.rollbackOneStateUpdate
        ).toHaveBeenOnlyCalledWith(mockKnexTransaction, fakeStateUpdate.id)
        expect(
          mockUserStatisticsPreprocessor.rollbackOneStateUpdate
        ).toHaveBeenOnlyCalledWith(mockKnexTransaction, fakeStateUpdate.id)
        if (l2TransactionsEnabled) {
          expect(
            mockUserL2TransactionsPreprocessor.rollbackOneStateUpdate
          ).toHaveBeenOnlyCalledWith(mockKnexTransaction, fakeStateUpdate.id)
        }
      })
    })

    it('throws when there are no preprocessings to roll back', async () => {
      const mockKnexTransaction = mockObject<Knex.Transaction>()
      const preprocessedRepo = mockObject<PreprocessedStateUpdateRepository>({
        findLast: async () => undefined,
        runInTransaction: async (fn) => fn(mockKnexTransaction),
      })
      const preprocessor = new Preprocessor(
        mockObject<KeyValueStore>(),
        preprocessedRepo,
        mockObject<StateUpdateRepository>(),
        mockObject<PerpetualHistoryPreprocessor>(),
        mockObject<StateDetailsPreprocessor>(),
        mockObject<UserStatisticsPreprocessor>(),
        mockObject<UserL2TransactionsStatisticsPreprocessor>(),
        mockObject<L2TransactionRepository>(),
        Logger.SILENT,
        mockObject<boolean>()
      )
      await expect(preprocessor.rollbackOneStateUpdate()).toBeRejectedWith(
        'Preprocessing rollback was requested, but there is nothing to roll back'
      )
    })
  })

  describe(
    Preprocessor.prototype.getStateUpdateIdToCatchUpL2TransactionsTo.name,
    () => {
      const trx = mockObject<Knex.Transaction>()
      const lastL2TransactionStateUpdateId = 100
      const mockedL2TransactionRepository = mockObject<L2TransactionRepository>(
        {
          findLatestStateUpdateId: mockFn().resolvesTo(
            lastL2TransactionStateUpdateId
          ),
        }
      )

      const preprocessor = new Preprocessor(
        mockObject<KeyValueStore>(),
        mockObject<PreprocessedStateUpdateRepository>(),
        mockObject<StateUpdateRepository>(),
        mockObject<PerpetualHistoryPreprocessor>(),
        mockObject<StateDetailsPreprocessor>(),
        mockObject<UserStatisticsPreprocessor>(),
        mockObject<UserL2TransactionsStatisticsPreprocessor>(),
        mockedL2TransactionRepository,
        Logger.SILENT,
        mockObject<boolean>()
      )

      it('returns the latest l2 transaction state update id if it is smaller than processed state update id', async () => {
        const preprocessTo =
          await preprocessor.getStateUpdateIdToCatchUpL2TransactionsTo(
            trx,
            lastL2TransactionStateUpdateId + 1
          )

        expect(
          mockedL2TransactionRepository.findLatestStateUpdateId
        ).toHaveBeenCalledWith(trx)
        expect(preprocessTo).toEqual(lastL2TransactionStateUpdateId)
      })

      it('returns the processed state update id if it is smaller than latest l2 transaction state update id', async () => {
        const preprocessTo =
          await preprocessor.getStateUpdateIdToCatchUpL2TransactionsTo(
            trx,
            lastL2TransactionStateUpdateId - 1
          )

        expect(
          mockedL2TransactionRepository.findLatestStateUpdateId
        ).toHaveBeenCalledWith(trx)
        expect(preprocessTo).toEqual(lastL2TransactionStateUpdateId - 1)
      })
    }
  )
})
