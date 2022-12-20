import { OnChainData, StarkExProgramOutput } from '@explorer/encoding'
import { PositionLeaf, RollupState } from '@explorer/state'
import { Hash256, PedersenHash, StarkKey, Timestamp } from '@explorer/types'
import { expect, mockFn } from 'earljs'

import { PerpetualRollupUpdater } from '../../src/core/PerpetualRollupUpdater'
import { ForcedTransactionsRepository } from '../../src/peripherals/database/ForcedTransactionsRepository'
import { PageRepository } from '../../src/peripherals/database/PageRepository'
import type { RollupStateRepository } from '../../src/peripherals/database/RollupStateRepository'
import { StateTransitionRecord } from '../../src/peripherals/database/StateTransitionRepository'
import { StateUpdateRepository } from '../../src/peripherals/database/StateUpdateRepository'
import type { EthereumClient } from '../../src/peripherals/ethereum/EthereumClient'
import { Logger } from '../../src/tools/Logger'
import { mock } from '../mock'

describe(PerpetualRollupUpdater.name, () => {
  describe(PerpetualRollupUpdater.prototype.loadRequiredPages.name, () => {
    it('throws if pages are missing in database', async () => {
      const pageRepository = mock<PageRepository>({
        getByStateTransitions: async () => [],
      })
      const stateUpdater = new PerpetualRollupUpdater(
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
      const stateUpdater = new PerpetualRollupUpdater(
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

  describe(
    PerpetualRollupUpdater.prototype.processOnChainStateTransition.name,
    () => {
      it('calls processStateTransition with updated positions', async () => {
        const updatedPositions = [
          {
            index: 5n,
            value: mock<PositionLeaf>({
              assets: [],
              collateralBalance: 555n,
              starkKey: StarkKey.fake(),
            }),
          },
        ]
        const updater = new PerpetualRollupUpdater(
          mock<PageRepository>(),
          mock<StateUpdateRepository>(),
          mock<RollupStateRepository>(),
          mock<EthereumClient>(),
          mock<ForcedTransactionsRepository>(),
          Logger.SILENT,
          mock<RollupState>({
            calculateUpdatedPositions: async () => updatedPositions,
          })
        )

        const mockProcessStateTransition =
          mockFn<
            [
              StateTransitionRecord,
              StarkExProgramOutput,
              { index: bigint; value: PositionLeaf }[]
            ]
          >()
        mockProcessStateTransition.returns(Promise.resolve())
        updater.processStateTransition = mockProcessStateTransition

        const update = {
          id: 1,
          stateTransitionHash: Hash256.fake('123'),
          blockNumber: 1,
        }
        const mockOnChainData = mock<OnChainData>()
        await updater.processOnChainStateTransition(update, mockOnChainData)
        expect(mockProcessStateTransition).toHaveBeenCalledWith([
          update,
          mockOnChainData,
          updatedPositions,
        ])
      })
    }
  )
})
