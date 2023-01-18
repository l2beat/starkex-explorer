import {
  ForcedAction,
  OnChainData,
  OraclePrice,
  State,
} from '@explorer/encoding'
import {
  InMemoryMerkleStorage,
  MerkleTree,
  PositionLeaf,
} from '@explorer/state'
import {
  AssetId,
  Hash256,
  PedersenHash,
  StarkKey,
  Timestamp,
} from '@explorer/types'
import { expect, mockFn } from 'earljs'

import { ForcedTransactionRepository } from '../peripherals/database/ForcedTransactionRepository'
import type { MerkleTreeRepository } from '../peripherals/database/MerkleTreeRepository'
import { PageRepository } from '../peripherals/database/PageRepository'
import { StateTransitionRecord } from '../peripherals/database/StateTransitionRepository'
import { StateUpdateRepository } from '../peripherals/database/StateUpdateRepository'
import type { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { mock } from '../test/mock'
import { Logger } from '../tools/Logger'
import { PerpetualRollupUpdater } from './PerpetualRollupUpdater'
import { EMPTY_STATE_HASH } from './PerpetualValidiumUpdater'

const emptyState: State = {
  positionRoot: PedersenHash.ZERO,
  positionHeight: 0,
  orderRoot: PedersenHash.ZERO,
  orderHeight: 0,
  indices: [],
  timestamp: Timestamp(0),
  oraclePrices: [],
  systemTime: Timestamp(0),
}

describe(PerpetualRollupUpdater.name, () => {
  it('has empty state hash correctly calculated', async function () {
    // calculating hashes is slow :(
    this.timeout(5000)

    const rollupStateRepository = mock<MerkleTreeRepository<PositionLeaf>>({
      persist: async () => {},
    })
    const emptyTree = await MerkleTree.create(
      rollupStateRepository,
      64n,
      PositionLeaf.EMPTY
    )
    const emptyHash = await emptyTree.hash()
    expect(emptyHash.toString()).toEqual(EMPTY_STATE_HASH.toString())
  })

  describe(PerpetualRollupUpdater.prototype.loadRequiredPages.name, () => {
    it('throws if pages are missing in database', async () => {
      const pageRepository = mock<PageRepository>({
        getByStateTransitions: async () => [],
      })
      const stateUpdater = new PerpetualRollupUpdater(
        pageRepository,
        mock<StateUpdateRepository>(),
        mock<MerkleTreeRepository<PositionLeaf>>(),
        mock<EthereumClient>(),
        mock<ForcedTransactionRepository>(),
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
        mock<MerkleTreeRepository<PositionLeaf>>(),
        mock<EthereumClient>(),
        mock<ForcedTransactionRepository>(),
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
        const storage = new InMemoryMerkleStorage<PositionLeaf>()
        const stateTree = await MerkleTree.create(
          storage,
          3n,
          PositionLeaf.EMPTY
        )

        const updater = new PerpetualRollupUpdater(
          mock<PageRepository>(),
          mock<StateUpdateRepository>(),
          storage,
          mock<EthereumClient>(),
          mock<ForcedTransactionRepository>(),
          Logger.SILENT,
          stateTree
        )

        const mockProcessStateTransition =
          mockFn<
            [
              StateTransitionRecord,
              PedersenHash,
              ForcedAction[],
              OraclePrice[],
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
        const testForcedActions: ForcedAction[] = [
          {
            type: 'withdrawal',
            starkKey: StarkKey.fake('876'),
            positionId: 4n,
            amount: 55n,
          },
        ]
        const mockOnChainData = mock<OnChainData>({
          oldState: emptyState,
          newState: mock<State>({
            positionRoot: PedersenHash.fake('987'),
            oraclePrices: [{ assetId: AssetId('BTC-9'), price: 5n }],
          }),
          forcedActions: testForcedActions,
          funding: [],
          positions: [
            {
              positionId: 5n,
              collateralBalance: 555n,
              fundingTimestamp: Timestamp(0),
              starkKey: StarkKey.fake('5'),
              balances: [],
            },
          ],
        })
        const updatedPositions = [
          {
            index: 5n,
            value: new PositionLeaf(StarkKey.fake('5'), 555n, []),
          },
        ]
        await updater.processOnChainStateTransition(update, mockOnChainData)
        expect(mockProcessStateTransition).toHaveBeenCalledWith([
          update,
          PedersenHash.fake('987'),
          testForcedActions,
          mockOnChainData.newState.oraclePrices,
          updatedPositions,
        ])
      })
    }
  )
})
