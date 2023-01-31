import { Hash256, PedersenHash, Timestamp } from '@explorer/types'
import { expect } from 'earljs'
import { Knex } from 'knex'

import { PreprocessedStateUpdateRepository } from '../../peripherals/database/PreprocessedStateUpdateRepository'
import {
  StateUpdateRecord,
  StateUpdateRepository,
} from '../../peripherals/database/StateUpdateRepository'
import { mock } from '../../test/mock'
import { Logger } from '../../tools/Logger'
import { Preprocessor, SyncDirection } from './Preprocessor'

const generateFakeStateUpdate = (
  state_update_id: number
): StateUpdateRecord => ({
  id: state_update_id,
  blockNumber: 10_000 + state_update_id,
  rootHash: PedersenHash.fake(),
  stateTransitionHash: Hash256.fake(),
  timestamp: Timestamp(0),
})

describe(Preprocessor.name, () => {
  describe(Preprocessor.prototype.sync.name, () => {
    it('correctly moves forward and backward', async () => {
      const preprocessor = new Preprocessor(
        mock<PreprocessedStateUpdateRepository>(),
        mock<StateUpdateRepository>(),
        Logger.SILENT
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
        return directions[index++] ?? 'not-needed'
      }

      const actualCalls: SyncDirection[] = []
      preprocessor.processNextStateUpdate = async () => {
        actualCalls.push('forward')
      }
      preprocessor.rollbackOneStateUpdate = async () => {
        actualCalls.push('backward')
      }

      await preprocessor.sync()
      expect(actualCalls).toEqual(directions)
    })
  })

  describe(Preprocessor.prototype.calculateRequiredSyncDirection.name, () => {
    it('returns not-needed when everything is empty', async () => {
      const stateUpdateRepo = mock<StateUpdateRepository>({
        findLast: async () => undefined,
      })
      const preprocessedRepo = mock<PreprocessedStateUpdateRepository>({
        findLast: async () => undefined,
      })
      const preprocessor = new Preprocessor(
        preprocessedRepo,
        stateUpdateRepo,
        Logger.SILENT
      )
      expect(await preprocessor.calculateRequiredSyncDirection()).toEqual(
        'not-needed'
      )
    })

    it('returns backward when there are no state updates but preprocessing has entries', async () => {
      const stateUpdateRepo = mock<StateUpdateRepository>({
        findLast: async () => undefined,
      })
      const preprocessedRepo = mock<PreprocessedStateUpdateRepository>({
        findLast: async () => ({
          stateUpdateId: 3,
          stateTransitionHash: Hash256.fake(),
        }),
      })
      const preprocessor = new Preprocessor(
        preprocessedRepo,
        stateUpdateRepo,
        Logger.SILENT
      )
      expect(await preprocessor.calculateRequiredSyncDirection()).toEqual(
        'backward'
      )
    })

    it('returns forward when there are state updates but preprocessing has no entries', async () => {
      const fakeStateUpdate = generateFakeStateUpdate(3)
      const stateUpdateRepo = mock<StateUpdateRepository>({
        findLast: async () => fakeStateUpdate,
      })
      const preprocessedRepo = mock<PreprocessedStateUpdateRepository>({
        findLast: async () => undefined,
      })
      const preprocessor = new Preprocessor(
        preprocessedRepo,
        stateUpdateRepo,
        Logger.SILENT
      )
      expect(await preprocessor.calculateRequiredSyncDirection()).toEqual(
        'forward'
      )
    })

    it('returns backward when state update id is before preprocessing', async () => {
      const fakeStateUpdate = generateFakeStateUpdate(2)
      const stateUpdateRepo = mock<StateUpdateRepository>({
        findLast: async () => fakeStateUpdate,
      })
      const preprocessedRepo = mock<PreprocessedStateUpdateRepository>({
        findLast: async () => ({
          stateUpdateId: fakeStateUpdate.id + 1,
          stateTransitionHash: Hash256.fake(),
        }),
      })
      const preprocessor = new Preprocessor(
        preprocessedRepo,
        stateUpdateRepo,
        Logger.SILENT
      )
      expect(await preprocessor.calculateRequiredSyncDirection()).toEqual(
        'backward'
      )
    })

    it("throws when the are more state updates but can't find preprocessed id", async () => {
      const fakeStateUpdate = generateFakeStateUpdate(10)
      const stateUpdateRepo = mock<StateUpdateRepository>({
        findById: async () => undefined,
        findLast: async () => fakeStateUpdate,
      })
      const preprocessedRepo = mock<PreprocessedStateUpdateRepository>({
        findLast: async () => ({
          stateUpdateId: fakeStateUpdate.id - 1,
          stateTransitionHash: Hash256.fake(),
        }),
      })
      const preprocessor = new Preprocessor(
        preprocessedRepo,
        stateUpdateRepo,
        Logger.SILENT
      )
      await expect(preprocessor.calculateRequiredSyncDirection()).toBeRejected(
        'Missing expected state update during Preprocessor sync'
      )
    })

    it('returns not-needed when last state update ids and transition hashes match', async () => {
      const fakeStateUpdate = generateFakeStateUpdate(10)
      const stateUpdateRepo = mock<StateUpdateRepository>({
        findById: async (id: number) => ({ [10]: fakeStateUpdate }[id]),
        findLast: async () => fakeStateUpdate,
      })
      const preprocessedRepo = mock<PreprocessedStateUpdateRepository>({
        findLast: async () => ({
          stateUpdateId: fakeStateUpdate.id,
          stateTransitionHash: fakeStateUpdate.stateTransitionHash,
        }),
      })
      const preprocessor = new Preprocessor(
        preprocessedRepo,
        stateUpdateRepo,
        Logger.SILENT
      )
      expect(await preprocessor.calculateRequiredSyncDirection()).toEqual(
        'not-needed'
      )
    })

    // This can happen when there was a reorg and then a few more state updates were added
    it('returns backward when last state update ids match but transition hash is mismatched', async () => {
      const fakeStateUpdate = generateFakeStateUpdate(10)
      const stateUpdateRepo = mock<StateUpdateRepository>({
        findById: async (id: number) => ({ [10]: fakeStateUpdate }[id]),
        findLast: async () => fakeStateUpdate,
      })
      const preprocessedRepo = mock<PreprocessedStateUpdateRepository>({
        findLast: async () => ({
          stateUpdateId: fakeStateUpdate.id,
          stateTransitionHash: Hash256.fake(),
        }),
      })
      const preprocessor = new Preprocessor(
        preprocessedRepo,
        stateUpdateRepo,
        Logger.SILENT
      )
      expect(await preprocessor.calculateRequiredSyncDirection()).toEqual(
        'backward'
      )
    })

    // This can happen when there was a reorg and then a few more state updates were added
    it('returns backward when state is ahead of preprocessing but current transition hash is mismatched', async () => {
      const fakeStateUpdate5 = generateFakeStateUpdate(5)
      const fakeStateUpdate10 = generateFakeStateUpdate(10)
      const stateUpdateRepo = mock<StateUpdateRepository>({
        findById: async (id: number) => ({ [5]: fakeStateUpdate5 }[id]),
        findLast: async () => fakeStateUpdate10,
      })
      const preprocessedRepo = mock<PreprocessedStateUpdateRepository>({
        findLast: async () => ({
          stateUpdateId: 5,
          stateTransitionHash: Hash256.fake(),
        }),
      })
      const preprocessor = new Preprocessor(
        preprocessedRepo,
        stateUpdateRepo,
        Logger.SILENT
      )
      expect(await preprocessor.calculateRequiredSyncDirection()).toEqual(
        'backward'
      )
    })

    it('returns forward when state is ahead and current transition hash matches', async () => {
      const fakeStateUpdate5 = generateFakeStateUpdate(5)
      const fakeStateUpdate10 = generateFakeStateUpdate(10)
      const stateUpdateRepo = mock<StateUpdateRepository>({
        findById: async (id: number) => ({ [5]: fakeStateUpdate5 }[id]),
        findLast: async () => fakeStateUpdate10,
      })
      const preprocessedRepo = mock<PreprocessedStateUpdateRepository>({
        findLast: async () => ({
          stateUpdateId: 5,
          stateTransitionHash: fakeStateUpdate5.stateTransitionHash,
        }),
      })
      const preprocessor = new Preprocessor(
        preprocessedRepo,
        stateUpdateRepo,
        Logger.SILENT
      )
      expect(await preprocessor.calculateRequiredSyncDirection()).toEqual(
        'forward'
      )
    })
  })

  describe(Preprocessor.prototype.processNextStateUpdate.name, () => {
    it('correctly updates preprocessedStateUpdateRepository in SQL transaction', async () => {
      const fakeStateUpdate1 = generateFakeStateUpdate(1)
      const fakeStateUpdate2 = generateFakeStateUpdate(2)
      const mockKnexTransaction = mock<Knex.Transaction>()
      const stateUpdateRepo = mock<StateUpdateRepository>({
        findById: async (id: number) => ({ [2]: fakeStateUpdate2 }[id]),
      })
      const preprocessedRepo = mock<PreprocessedStateUpdateRepository>({
        findLast: async () => ({
          stateUpdateId: fakeStateUpdate1.id,
          stateTransitionHash: fakeStateUpdate1.stateTransitionHash,
        }),
        add: async () => 0,
        runInTransaction: async (fn) => fn(mockKnexTransaction),
      })
      const preprocessor = new Preprocessor(
        preprocessedRepo,
        stateUpdateRepo,
        Logger.SILENT
      )
      await preprocessor.processNextStateUpdate()
      expect(preprocessedRepo.add).toHaveBeenCalledWith([
        {
          stateUpdateId: fakeStateUpdate2.id,
          stateTransitionHash: fakeStateUpdate2.stateTransitionHash,
        },
        mockKnexTransaction,
      ])
    })

    it('throws when next state update is missing', async () => {
      const fakeStateUpdate2 = generateFakeStateUpdate(2)
      const mockKnexTransaction = mock<Knex.Transaction>()
      const stateUpdateRepo = mock<StateUpdateRepository>({
        findById: async (id: number) => ({ [2]: fakeStateUpdate2 }[id]),
      })
      const preprocessedRepo = mock<PreprocessedStateUpdateRepository>({
        findLast: async () => ({
          stateUpdateId: fakeStateUpdate2.id,
          stateTransitionHash: fakeStateUpdate2.stateTransitionHash,
        }),
        add: async () => 0,
        runInTransaction: async (fn) => fn(mockKnexTransaction),
      })
      const preprocessor = new Preprocessor(
        preprocessedRepo,
        stateUpdateRepo,
        Logger.SILENT
      )
      await expect(preprocessor.processNextStateUpdate()).toBeRejected(
        'Preprocessing was requested, but next state update (3) is missing'
      )
    })
  })

  describe(Preprocessor.prototype.rollbackOneStateUpdate.name, () => {
    it('correctly updates preprocessedStateUpdateRepository in SQL transaction', async () => {
      const fakeStateUpdate = generateFakeStateUpdate(2)
      const mockKnexTransaction = mock<Knex.Transaction>()
      const preprocessedRepo = mock<PreprocessedStateUpdateRepository>({
        findLast: async () => ({
          stateUpdateId: fakeStateUpdate.id,
          stateTransitionHash: fakeStateUpdate.stateTransitionHash,
        }),
        runInTransaction: async (fn) => fn(mockKnexTransaction),
        deleteByStateUpdateId: async () => 1,
      })
      const preprocessor = new Preprocessor(
        preprocessedRepo,
        mock<StateUpdateRepository>(),
        Logger.SILENT
      )
      await preprocessor.rollbackOneStateUpdate()
      expect(preprocessedRepo.deleteByStateUpdateId).toHaveBeenCalledWith([
        fakeStateUpdate.id,
        mockKnexTransaction,
      ])
    })
  })
})
