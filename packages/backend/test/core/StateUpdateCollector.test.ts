import { Hash256, PedersenHash } from '@explorer/types'
import { expect, mockFn } from 'earljs'

import {
  ROLLUP_STATE_EMPTY_HASH,
  StateUpdateCollector,
} from '../../src/core/StateUpdateCollector'
import type { PageRepository } from '../../src/peripherals/database/PageRepository'
import type { RollupStateRepository } from '../../src/peripherals/database/RollupStateRepository'
import type { StateUpdateRepository } from '../../src/peripherals/database/StateUpdateRepository'
import type { EthereumClient } from '../../src/peripherals/ethereum/EthereumClient'
import { mock } from '../mock'

describe(StateUpdateCollector.name, () => {
  describe(StateUpdateCollector.prototype.ensureRollupState.name, () => {
    it('sets state before an initial state transition', async () => {
      const rollupStateRepository = mock<RollupStateRepository>({
        persist: async () => {},
      })
      const stateUpdateCollector = new StateUpdateCollector(
        mock<PageRepository>(),
        mock<StateUpdateRepository>(),
        rollupStateRepository,
        mock<EthereumClient>()
      )
      // ROLLUP_STATE_EMPTY_HASH is for tree of height 64 and  recalculating this hash
      // in tests on slower machines (e.g. CI) makes test flakey async-wise.
      const rollupState = await stateUpdateCollector.ensureRollupState(
        ROLLUP_STATE_EMPTY_HASH,
        3n
      )
      const rollupStateEmptyHashForHeight3 = PedersenHash(
        '048c477cdb37576ddff3c3fe5c1c7559778d6cbade51e5a6c1fe71e6bdb1d4db'
      )
      expect(await rollupState.positions.hash()).toEqual(
        rollupStateEmptyHashForHeight3
      )
      expect(rollupStateRepository.persist.calls.length).toEqual(1)
    })

    it('sets state after restart', async () => {
      const stateUpdateCollector = new StateUpdateCollector(
        mock<PageRepository>(),
        mock<StateUpdateRepository>(),
        mock<RollupStateRepository>(),
        mock<EthereumClient>()
      )
      const hash = PedersenHash.fake()
      const rollupState = await stateUpdateCollector.ensureRollupState(hash)
      expect(await rollupState.positions.hash()).toEqual(hash)
    })

    it('resests state after reorg', async () => {
      const stateUpdateCollector = new StateUpdateCollector(
        mock<PageRepository>(),
        mock<StateUpdateRepository>(),
        mock<RollupStateRepository>(),
        mock<EthereumClient>()
      )
      const hashA = PedersenHash.fake('a')
      const hashB = PedersenHash.fake('b')
      const rollupStateA = await stateUpdateCollector.ensureRollupState(hashA)
      const rollupStateB = await stateUpdateCollector.ensureRollupState(hashB)
      expect(await rollupStateA.positions.hash()).toEqual(hashA)
      expect(await rollupStateB.positions.hash()).toEqual(hashB)
    })

    it('leaves state intact before a subsequent state transition', async () => {
      const stateUpdateCollector = new StateUpdateCollector(
        mock<PageRepository>(),
        mock<StateUpdateRepository>(),
        mock<RollupStateRepository>(),
        mock<EthereumClient>()
      )
      const hash = PedersenHash.fake()
      const rollupStateA = await stateUpdateCollector.ensureRollupState(hash)
      const rollupStateB = await stateUpdateCollector.ensureRollupState(hash)
      expect(rollupStateA).toReferentiallyEqual(rollupStateB)
    })
  })

  describe(StateUpdateCollector.prototype.save.name, () => {
    it('calls processStateTransition for every update', async () => {
      const pageRepository = mock<PageRepository>({
        getAllForFacts: async () => [
          { factHash: Hash256.fake('a'), pages: ['aa', 'ab', 'ac'] },
          { factHash: Hash256.fake('b'), pages: ['ba', 'bb'] },
        ],
      })
      const stateUpdateRepository = mock<StateUpdateRepository>({
        getLast: async () => ({
          rootHash: PedersenHash.fake('1234'),
          id: 567,
          timestamp: Math.random(),
          blockNumber: Math.random(),
          factHash: Hash256.fake(),
        }),
      })
      const stateUpdateCollector = new StateUpdateCollector(
        pageRepository,
        stateUpdateRepository,
        mock<RollupStateRepository>(),
        mock<EthereumClient>()
      )
      const processStateTransition = mockFn().resolvesTo(undefined)
      stateUpdateCollector.processStateTransition = processStateTransition

      await stateUpdateCollector.save([
        { blockNumber: 123, hash: Hash256.fake('123') },
        { blockNumber: 456, hash: Hash256.fake('456') },
      ])
      expect(processStateTransition).toHaveBeenCalledExactlyWith([
        [
          {
            blockNumber: 123,
            factHash: Hash256.fake('a'),
            pages: ['aa', 'ab', 'ac'],
          },
          567 + 1,
        ],
        [
          {
            blockNumber: 456,
            factHash: Hash256.fake('b'),
            pages: ['ba', 'bb'],
          },
          567 + 2,
        ],
      ])
    })
  })

  describe(StateUpdateCollector.prototype.processStateTransition.name, () => {
    it('saves the state update to the database')
  })

  describe(StateUpdateCollector.prototype.discardAfter.name, () => {
    it('deletes updates after block number', async () => {
      const stateUpdateRepository = mock<StateUpdateRepository>({
        deleteAllAfter: async () => {},
      })

      const stateUpdateCollector = new StateUpdateCollector(
        mock<PageRepository>(),
        stateUpdateRepository,
        mock<RollupStateRepository>(),
        mock<EthereumClient>()
      )

      await stateUpdateCollector.discardAfter(20)
      await stateUpdateCollector.discardAfter(40)

      expect(stateUpdateRepository.deleteAllAfter).toHaveBeenCalledExactlyWith([
        [20],
        [40],
      ])
    })
  })
})
