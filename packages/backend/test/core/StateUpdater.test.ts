import { AssetId, Hash256, PedersenHash, StarkKey } from '@explorer/types'
import { expect } from 'earljs'

import { StateUpdater } from '../../src/core/StateUpdater'
import { ForcedTransactionsRepository } from '../../src/peripherals/database/ForcedTransactionsRepository'
import type { RollupStateRepository } from '../../src/peripherals/database/RollupStateRepository'
import { StateUpdateRepository } from '../../src/peripherals/database/StateUpdateRepository'
import type { EthereumClient } from '../../src/peripherals/ethereum/EthereumClient'
import { Logger } from '../../src/tools/Logger'
import { mock } from '../mock'

const EMPTY_STATE_HASH = PedersenHash(
  '52ddcbdd431a044cf838a71d194248640210b316d7b1a568997ecad9dec9626'
)

describe(StateUpdater.name, () => {
  describe(StateUpdater.prototype.ensureRollupState.name, () => {
    it('sets state before an initial state transition', async () => {
      const rollupStateRepository = mock<RollupStateRepository>({
        persist: async () => {},
      })
      const stateUpdater = new StateUpdater(
        mock<StateUpdateRepository>(),
        rollupStateRepository,
        mock<EthereumClient>(),
        mock<ForcedTransactionsRepository>(),
        Logger.SILENT,
        EMPTY_STATE_HASH
      )
      // EMPTY_STATE_HASH is for tree of height 64 and  recalculating this hash
      // in tests on slower machines (e.g. CI) makes test flakey async-wise.
      const rollupState = await stateUpdater.ensureRollupState(
        EMPTY_STATE_HASH,
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
        mock<StateUpdateRepository>(),
        mock<RollupStateRepository>(),
        mock<EthereumClient>(),
        mock<ForcedTransactionsRepository>(),
        Logger.SILENT,
        EMPTY_STATE_HASH
      )
      const hash = PedersenHash.fake()
      const rollupState = await stateUpdater.ensureRollupState(hash)
      expect(await rollupState.positionTree.hash()).toEqual(hash)
    })

    it('resets state after reorg', async () => {
      const stateUpdater = new StateUpdater(
        mock<StateUpdateRepository>(),
        mock<RollupStateRepository>(),
        mock<EthereumClient>(),
        mock<ForcedTransactionsRepository>(),
        Logger.SILENT,
        EMPTY_STATE_HASH
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
        mock<StateUpdateRepository>(),
        mock<RollupStateRepository>(),
        mock<EthereumClient>(),
        mock<ForcedTransactionsRepository>(),
        Logger.SILENT,
        EMPTY_STATE_HASH
      )
      const hash = PedersenHash.fake()
      const rollupStateA = await stateUpdater.ensureRollupState(hash)
      const rollupStateB = await stateUpdater.ensureRollupState(hash)
      expect(rollupStateA).toReferentiallyEqual(rollupStateB)
    })
  })

  describe(StateUpdater.prototype.discardAfter.name, () => {
    it('deletes updates after block number', async () => {
      const stateUpdateRepository = mock<StateUpdateRepository>({
        deleteAfter: async () => 0,
      })

      const stateUpdater = new StateUpdater(
        stateUpdateRepository,
        mock<RollupStateRepository>(),
        mock<EthereumClient>(),
        mock<ForcedTransactionsRepository>(),
        Logger.SILENT,
        EMPTY_STATE_HASH
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
        mock<StateUpdateRepository>(),
        mock<RollupStateRepository>(),
        mock<EthereumClient>(),
        forcedTransactionsRepository,
        Logger.SILENT,
        EMPTY_STATE_HASH
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
