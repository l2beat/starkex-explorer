import { OnChainData, PerpetualForcedAction, State } from '@explorer/encoding'
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
import { expect, mockFn, mockObject } from 'earl'

import type { MerkleTreeRepository } from '../peripherals/database/MerkleTreeRepository'
import { PageRepository } from '../peripherals/database/PageRepository'
import { StateUpdateRepository } from '../peripherals/database/StateUpdateRepository'
import { UserTransactionRepository } from '../peripherals/database/transactions/UserTransactionRepository'
import type { EthereumClient } from '../peripherals/ethereum/EthereumClient'
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

    const rollupStateRepository = mockObject<
      MerkleTreeRepository<PositionLeaf>
    >({
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
      const pageRepository = mockObject<PageRepository>({
        getByStateTransitions: async () => [],
      })
      const stateUpdater = new PerpetualRollupUpdater(
        pageRepository,
        mockObject<StateUpdateRepository>(),
        mockObject<MerkleTreeRepository<PositionLeaf>>(),
        mockObject<EthereumClient>(),
        mockObject<UserTransactionRepository>(),
        Logger.SILENT
      )
      await expect(
        stateUpdater.loadRequiredPages([
          {
            stateTransitionHash: Hash256.fake('a'),
            blockNumber: 1,
            transactionHash: Hash256.fake('b'),
            sequenceNumber: 1,
            batchId: 1,
          },
        ])
      ).toBeRejectedWith('Missing pages for state transitions in database')
    })

    it('returns correct StateTransition for every update', async () => {
      const pageRepository = mockObject<PageRepository>({
        getByStateTransitions: async () => [
          ['aa', 'ab', 'ac'],
          ['ba', 'bb'],
        ],
      })
      const lastStateUpdate = {
        rootHash: PedersenHash.fake('1234'),
        id: 567,
        batchId: 566,
        timestamp: Timestamp(1),
        blockNumber: Math.random(),
        stateTransitionHash: Hash256.fake(),
      }
      const stateUpdateRepository = mockObject<StateUpdateRepository>({
        findLast: async () => lastStateUpdate,
      })
      const stateUpdater = new PerpetualRollupUpdater(
        pageRepository,
        stateUpdateRepository,
        mockObject<MerkleTreeRepository<PositionLeaf>>(),
        mockObject<EthereumClient>(),
        mockObject<UserTransactionRepository>(),
        Logger.SILENT
      )

      const stateTransitions = await stateUpdater.loadRequiredPages([
        {
          blockNumber: 123,
          stateTransitionHash: Hash256.fake('123'),
          transactionHash: Hash256.fake('b'),
          sequenceNumber: 1,
          batchId: 0,
        },
        {
          blockNumber: 456,
          stateTransitionHash: Hash256.fake('456'),
          transactionHash: Hash256.fake('c'),
          sequenceNumber: 2,
          batchId: 1,
        },
      ])
      expect(stateTransitions).toEqual([
        {
          id: lastStateUpdate.id + 1,
          sequenceNumber: 1,
          batchId: 0,
          transactionHash: Hash256.fake('b'),
          blockNumber: 123,
          stateTransitionHash: Hash256.fake('123'),
          pages: ['aa', 'ab', 'ac'],
        },
        {
          id: lastStateUpdate.id + 2,
          blockNumber: 456,
          sequenceNumber: 2,
          batchId: 1,
          transactionHash: Hash256.fake('c'),
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
          mockObject<PageRepository>(),
          mockObject<StateUpdateRepository>(),
          storage,
          mockObject<EthereumClient>(),
          mockObject<UserTransactionRepository>(),
          Logger.SILENT,
          stateTree
        )

        const mockProcessStateTransition =
          mockFn<typeof updater.processStateTransition>()
        mockProcessStateTransition.resolvesTo(undefined)
        updater.processStateTransition = mockProcessStateTransition

        const batchId = 0
        const update = {
          id: 1,
          stateTransitionHash: Hash256.fake('123'),
          blockNumber: 1,
        }
        const testForcedActions: PerpetualForcedAction[] = [
          {
            type: 'withdrawal',
            starkKey: StarkKey.fake('876'),
            positionId: 4n,
            amount: 55n,
          },
        ]
        const mockOnChainData = mockObject<OnChainData>({
          oldState: emptyState,
          newState: mockObject<State>({
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
        await updater.processOnChainStateTransition(
          update,
          batchId,
          mockOnChainData
        )
        expect(mockProcessStateTransition).toHaveBeenOnlyCalledWith(
          update,
          batchId,
          PedersenHash.fake('987'),
          testForcedActions,
          mockOnChainData.newState.oraclePrices,
          updatedPositions
        )
      })
    }
  )
})
