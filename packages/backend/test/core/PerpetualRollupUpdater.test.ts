import { Block } from '@ethersproject/providers'
import { MerkleTree, PositionLeaf, RollupState } from '@explorer/state'
import { Hash256, PedersenHash, Timestamp } from '@explorer/types'
import { expect } from 'earljs'

import { PerpetualRollupUpdater } from '../../src/core/PerpetualRollupUpdater'
import { ForcedTransactionsRepository } from '../../src/peripherals/database/ForcedTransactionsRepository'
import type { PageRepository } from '../../src/peripherals/database/PageRepository'
import type { RollupStateRepository } from '../../src/peripherals/database/RollupStateRepository'
import { StateUpdateRepository } from '../../src/peripherals/database/StateUpdateRepository'
import type { EthereumClient } from '../../src/peripherals/ethereum/EthereumClient'
import { Logger } from '../../src/tools/Logger'
import { decodedFakePages } from '../fakes'
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
      it('throws if calculated root hash does not match the one from verifier', async () => {
        const collector = new PerpetualRollupUpdater(
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
    }
  )
})
