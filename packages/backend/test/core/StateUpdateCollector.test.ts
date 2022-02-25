import { PedersenHash } from '@explorer/crypto'
import { AssetId, OnChainData } from '@explorer/encoding'
import { Position } from '@explorer/state'
import { expect } from 'earljs'
import type { providers } from 'ethers'

import {
  ROLLUP_STATE_EMPTY_HASH,
  StateUpdateCollector,
} from '../../src/core/StateUpdateCollector'
import { Hash256 } from '../../src/model'
import type { PageRepository } from '../../src/peripherals/database/PageRepository'
import type { RollupStateRepository } from '../../src/peripherals/database/RollupStateRepository'
import type { StateTransitionFactRecord } from '../../src/peripherals/database/StateTransitionFactsRepository'
import type {
  StateUpdateRecord,
  StateUpdateRepository,
} from '../../src/peripherals/database/StateUpdateRepository'
import type { EthereumClient } from '../../src/peripherals/ethereum/EthereumClient'
import { mock } from '../mock'

describe(StateUpdateCollector.name, () => {
  describe(StateUpdateCollector.prototype.ensureRollupState.name, () => {
    it('sets state for an initial update', async () => {})
    it('leaves state a subsequent update')
    it('sets state for the first update after restart')
    it('resests state for the update after reorg')
  })

  describe(StateUpdateCollector.prototype.save.name, () => {
    it('calls processStateTransition for every update')
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
