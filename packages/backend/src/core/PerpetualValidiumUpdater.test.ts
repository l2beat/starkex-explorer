import {
  AssetConfigHash,
  PerpetualForcedAction,
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
import { Logger } from '@l2beat/backend-tools'
import { expect, mockFn, mockObject } from 'earl'

import type { MerkleTreeRepository } from '../peripherals/database/MerkleTreeRepository'
import { StateUpdateRepository } from '../peripherals/database/StateUpdateRepository'
import { UserTransactionRepository } from '../peripherals/database/transactions/UserTransactionRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import {
  EMPTY_STATE_HASH,
  PerpetualValidiumUpdater,
} from './PerpetualValidiumUpdater'

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

describe(PerpetualValidiumUpdater.name, () => {
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

  describe(
    PerpetualValidiumUpdater.prototype.processValidiumStateTransition.name,
    () => {
      it('calls processStateTransition with new position leaves', async () => {
        const storage = new InMemoryMerkleStorage<PositionLeaf>()
        const stateTree = await MerkleTree.create(
          storage,
          3n,
          PositionLeaf.EMPTY
        )

        const updater = new PerpetualValidiumUpdater(
          mockObject<StateUpdateRepository>(),
          storage,
          mockObject<EthereumClient>(),
          mockObject<UserTransactionRepository>(),
          Logger.SILENT,
          stateTree
        )

        const processedStateUpdate = {
          id: 1,
          batchId: 0,
          blockNumber: 1111,
          stateTransitionHash: Hash256.fake('456'),
          rootHash: PedersenHash.fake('789'),
          timestamp: Timestamp(0),
          perpetualState: undefined,
        }
        const mockProcessStateTransition =
          mockFn<typeof updater.processStateTransition>()
        mockProcessStateTransition.resolvesTo(processedStateUpdate)
        updater.processStateTransition = mockProcessStateTransition

        const mockReadLastUpdate = mockFn()
        mockReadLastUpdate.returns(
          Promise.resolve({ oldHash: PedersenHash.fake('321'), id: 1 })
        )
        updater.readLastUpdate = mockReadLastUpdate

        const transition = {
          blockNumber: 1,
          transactionHash: Hash256.fake('123'),
          stateTransitionHash: Hash256.fake('456'),
          sequenceNumber: 12,
          batchId: 13,
        }
        const testForcedActions: PerpetualForcedAction[] = [
          {
            type: 'withdrawal',
            starkKey: StarkKey.fake('876'),
            positionId: 4n,
            amount: 55n,
          },
        ]
        const mockProgramOutput = {
          configurationHash: Hash256.fake('997'),
          assetConfigHashes: mockObject<AssetConfigHash[]>(),
          oldState: emptyState,
          newState: mockObject<State>({
            positionRoot: PedersenHash.fake('987'),
            oraclePrices: [{ assetId: AssetId('BTC-9'), price: 5n }],
          }),
          minimumExpirationTimestamp: 123n,
          modifications: [],
          forcedActions: testForcedActions,
          conditions: mockObject<PedersenHash[]>(),
        }
        const testPerpetualBatch = {
          previousBatchId: 12,
          positionRoot: PedersenHash.fake('666'),
          orderRoot: PedersenHash.fake('375'),
          positions: [
            {
              positionId: 5n,
              starkKey: StarkKey.fake('5'),
              collateralBalance: 555n,
              assets: [],
            },
          ],
          orders: [],
        }
        const updatedPositions = [
          {
            index: 5n,
            value: new PositionLeaf(StarkKey.fake('5'), 555n, []),
          },
        ]
        const update = {
          id: 2,
          blockNumber: transition.blockNumber,
          stateTransitionHash: transition.stateTransitionHash,
        }

        const result = await updater.processValidiumStateTransition(
          transition,
          mockProgramOutput,
          testPerpetualBatch
        )
        expect(mockProcessStateTransition).toHaveBeenOnlyCalledWith(
          update,
          transition.batchId,
          mockProgramOutput.newState.positionRoot,
          testForcedActions,
          mockProgramOutput.newState.oraclePrices,
          updatedPositions,
          mockProgramOutput.newState
        )
        expect(result).toEqual(processedStateUpdate)
      })
    }
  )
})
