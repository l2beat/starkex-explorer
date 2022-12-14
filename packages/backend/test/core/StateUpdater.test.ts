import { Block } from '@ethersproject/providers'
import { MerkleTree, PositionLeaf, RollupState } from '@explorer/state'
import {
  AssetId,
  Hash256,
  PedersenHash,
  StarkKey,
  Timestamp,
} from '@explorer/types'
import { expect } from 'earljs'

import {
  ROLLUP_STATE_EMPTY_HASH,
  StateUpdater,
} from '../../src/core/StateUpdater'
import { ForcedTransactionsRepository } from '../../src/peripherals/database/ForcedTransactionsRepository'
import type { PageRepository } from '../../src/peripherals/database/PageRepository'
import type { RollupStateRepository } from '../../src/peripherals/database/RollupStateRepository'
import { StateUpdateRepository } from '../../src/peripherals/database/StateUpdateRepository'
import type { EthereumClient } from '../../src/peripherals/ethereum/EthereumClient'
import { Logger } from '../../src/tools/Logger'
import { decodedFakePages } from '../fakes'
import { mock } from '../mock'

describe(StateUpdater.name, () => {
  describe(StateUpdater.prototype.ensureRollupState.name, () => {
    it('sets state before an initial state transition', async () => {
      const rollupStateRepository = mock<RollupStateRepository>({
        persist: async () => {},
      })
      const stateUpdater = new StateUpdater(
        mock<PageRepository>(),
        mock<StateUpdateRepository>(),
        rollupStateRepository,
        mock<EthereumClient>(),
        mock<ForcedTransactionsRepository>(),
        Logger.SILENT
      )
      // ROLLUP_STATE_EMPTY_HASH is for tree of height 64 and  recalculating this hash
      // in tests on slower machines (e.g. CI) makes test flakey async-wise.
      const rollupState = await stateUpdater.ensureRollupState(
        ROLLUP_STATE_EMPTY_HASH,
        3n
      )
      const rollupStateEmptyHashForHeight3 = PedersenHash(
        '048c477cdb37576ddff3c3fe5c1c7559778d6cbade51e5a6c1fe71e6bdb1d4db'
      )
      expect(await rollupState.positionTree.hash()).toEqual(
        rollupStateEmptyHashForHeight3
      )
      expect(rollupStateRepository.persist.calls.length).toEqual(1)
    })

    it('sets state after restart', async () => {
      const stateUpdater = new StateUpdater(
        mock<PageRepository>(),
        mock<StateUpdateRepository>(),
        mock<RollupStateRepository>(),
        mock<EthereumClient>(),
        mock<ForcedTransactionsRepository>(),
        Logger.SILENT
      )
      const hash = PedersenHash.fake()
      const rollupState = await stateUpdater.ensureRollupState(hash)
      expect(await rollupState.positionTree.hash()).toEqual(hash)
    })

    it('resets state after reorg', async () => {
      const stateUpdater = new StateUpdater(
        mock<PageRepository>(),
        mock<StateUpdateRepository>(),
        mock<RollupStateRepository>(),
        mock<EthereumClient>(),
        mock<ForcedTransactionsRepository>(),
        Logger.SILENT
      )
      const hashA = PedersenHash.fake('a')
      const hashB = PedersenHash.fake('b')
      const rollupStateA = await stateUpdater.ensureRollupState(hashA)
      const rollupStateB = await stateUpdater.ensureRollupState(hashB)
      expect(await rollupStateA.positionTree.hash()).toEqual(hashA)
      expect(await rollupStateB.positionTree.hash()).toEqual(hashB)
    })

    it('leaves state intact before a subsequent state transition', async () => {
      const stateUpdater = new StateUpdater(
        mock<PageRepository>(),
        mock<StateUpdateRepository>(),
        mock<RollupStateRepository>(),
        mock<EthereumClient>(),
        mock<ForcedTransactionsRepository>(),
        Logger.SILENT
      )
      const hash = PedersenHash.fake()
      const rollupStateA = await stateUpdater.ensureRollupState(hash)
      const rollupStateB = await stateUpdater.ensureRollupState(hash)
      expect(rollupStateA).toReferentiallyEqual(rollupStateB)
    })
  })

  describe(StateUpdater.prototype.loadRequiredPages.name, () => {
    it('throws if pages are missing in database', async () => {
      const pageRepository = mock<PageRepository>({
        getByStateTransitions: async () => [],
      })
      const stateUpdater = new StateUpdater(
        pageRepository,
        mock<StateUpdateRepository>(),
        mock<RollupStateRepository>(),
        mock<EthereumClient>(),
        mock<ForcedTransactionsRepository>(),
        Logger.SILENT
      )
      await expect(
        stateUpdater.loadRequiredPages([
          { stateTransitionHash: Hash256.fake('a'), blockNumber: 1 },
        ])
      ).toBeRejected('Missing pages for state transitions in database')
    })

    it('returns correct StateTransition for every update', async () => {
      const pageRepository = mock<PageRepository>({
        getByStateTransitions: async () => [
          ['aa', 'ab', 'ac'],
          ['ba', 'bb'],
        ],
      })
      const stateUpdateRepository = mock<StateUpdateRepository>({
        findLast: async () => ({
          rootHash: PedersenHash.fake('1234'),
          id: 567,
          timestamp: Timestamp(1),
          blockNumber: Math.random(),
          stateTransitionHash: Hash256.fake(),
        }),
      })
      const stateUpdater = new StateUpdater(
        pageRepository,
        stateUpdateRepository,
        mock<RollupStateRepository>(),
        mock<EthereumClient>(),
        mock<ForcedTransactionsRepository>(),
        Logger.SILENT
      )

      const stateTransitions = await stateUpdater.loadRequiredPages([
        { blockNumber: 123, stateTransitionHash: Hash256.fake('123') },
        { blockNumber: 456, stateTransitionHash: Hash256.fake('456') },
      ])
      expect(stateTransitions).toEqual([
        {
          id: 567 + 1,
          blockNumber: 123,
          stateTransitionHash: Hash256.fake('123'),
          pages: ['aa', 'ab', 'ac'],
        },
        {
          id: 567 + 2,
          blockNumber: 456,
          stateTransitionHash: Hash256.fake('456'),
          pages: ['ba', 'bb'],
        },
      ])
    })
  })

  describe(StateUpdater.prototype.processOnChainStateTransition.name, () => {
    it('throws if calculated root hash does not match the one from verifier', async () => {
      const collector = new StateUpdater(
        mock<PageRepository>(),
        mock<StateUpdateRepository>(),
        mock<RollupStateRepository>(),
        mock<EthereumClient>({
          getBlock: async () => {
            return { timestamp: 1 } as unknown as Block
          },
        }),
        mock<ForcedTransactionsRepository>(),
        Logger.SILENT,
        mock<RollupState>({
          calculateUpdatedPositions: async () => [
            { index: 1n, value: mock<PositionLeaf>() },
          ],
          update: async () =>
            ({
              positionTree: mock<MerkleTree<PositionLeaf>>({
                hash: async () => PedersenHash.fake('1234'),
              }),
            } as unknown as RollupState),
        })
      )

      await expect(
        collector.processOnChainStateTransition(
          {
            id: 1,
            stateTransitionHash: Hash256.fake('123'),
            blockNumber: 1,
          },
          decodedFakePages
        )
      ).toBeRejected('State transition calculated incorrectly')
    })
  })

  describe(StateUpdater.prototype.discardAfter.name, () => {
    it('deletes updates after block number', async () => {
      const stateUpdateRepository = mock<StateUpdateRepository>({
        deleteAfter: async () => 0,
      })

      const stateUpdater = new StateUpdater(
        mock<PageRepository>(),
        stateUpdateRepository,
        mock<RollupStateRepository>(),
        mock<EthereumClient>(),
        mock<ForcedTransactionsRepository>(),
        Logger.SILENT
      )

      await stateUpdater.discardAfter(20)
      await stateUpdater.discardAfter(40)

      expect(stateUpdateRepository.deleteAfter).toHaveBeenCalledExactlyWith([
        [20],
        [40],
      ])
    })
  })

  describe(StateUpdater.prototype.extractTransactionHashes.name, () => {
    it('throws if forced transaction missing in database', async () => {
      const forcedTransactionsRepository = mock<ForcedTransactionsRepository>({
        getTransactionHashesByData: async () => [Hash256.fake(), undefined],
      })

      const stateUpdater = new StateUpdater(
        mock<PageRepository>(),
        mock<StateUpdateRepository>(),
        mock<RollupStateRepository>(),
        mock<EthereumClient>(),
        forcedTransactionsRepository,
        Logger.SILENT
      )

      await expect(
        stateUpdater.extractTransactionHashes([
          {
            type: 'withdrawal',
            amount: 1n,
            positionId: 12n,
            starkKey: StarkKey.fake(),
          },
          {
            type: 'trade',
            positionIdA: 12n,
            positionIdB: 34n,
            starkKeyA: StarkKey.fake(),
            starkKeyB: StarkKey.fake(),
            collateralAmount: 123n,
            syntheticAmount: 456n,
            isABuyingSynthetic: true,
            nonce: 123n,
            syntheticAssetId: AssetId('ETH-7'),
          },
        ])
      ).toBeRejected(
        'Forced action included in state update does not have a matching mined transaction'
      )
    })
  })
})
