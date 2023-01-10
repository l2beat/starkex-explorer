import { AssetConfigHash, ForcedAction, OraclePrice, State } from '@explorer/encoding'
import { InMemoryMerkleStorage, MerkleTree, PositionLeaf } from '@explorer/state'
import { AssetId, Hash256, PedersenHash, StarkKey, Timestamp } from '@explorer/types'
import { expect, mockFn } from 'earljs'

import {
  EMPTY_STATE_HASH,
  PerpetualValidiumUpdater,
} from '../../src/core/PerpetualValidiumUpdater'
import { ForcedTransactionRepository } from '../../src/peripherals/database/ForcedTransactionRepository'
import type { MerkleTreeRepository } from '../../src/peripherals/database/MerkleTreeRepository'
import { StateTransitionRecord } from '../../src/peripherals/database/StateTransitionRepository'
import { StateUpdateRepository } from '../../src/peripherals/database/StateUpdateRepository'
import { EthereumClient } from '../../src/peripherals/ethereum/EthereumClient'
import { Logger } from '../../src/tools/Logger'
import { mock } from '../mock'

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
  it('has empty state hash correcly calculated', async () => {
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

        const mockReadLastupdate = mockFn()
        mockReadLastupdate.returns(Promise.resolve({oldHash: PedersenHash.fake('321'), id: 1}))
        updater.readLastUpdate = mockReadLastupdate
        
        
        const transition = {
          blockNumber: 1,
          transactionHash: Hash256.fake('123'),
          stateTransitionHash: Hash256.fake('456'),
          sequenceNumber: 12,
          batchId: 13
        }
        const testForcedActions: ForcedAction[] = [
          {
            type: 'withdrawal',
            starkKey: StarkKey.fake('876'),
            positionId: 4n,
            amount: 55n,
          },
        ]
        const mockProgramOutput = {
          configurationHash: Hash256.fake('997'),
          assetConfigHashes: mock<AssetConfigHash[]>(),
          oldState: emptyState,
          newState: mock<State>({
            positionRoot: PedersenHash.fake('987'),
            oraclePrices: [{ assetId: AssetId('BTC-9'), price: 5n }],
          }),
          minimumExpirationTimestamp: 123n,
          modifications: [],
          forcedActions: testForcedActions,
          conditions: mock<PedersenHash[]>()
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
              assets: []
            }
          ],
          orders: []
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

        await updater.processValidiumStateTransition(transition, mockProgramOutput, testPerpetualBatch)
        expect(mockProcessStateTransition).toHaveBeenCalledWith([
          update,
          mockProgramOutput.newState.positionRoot,
          testForcedActions,
          mockProgramOutput.newState.oraclePrices,
          updatedPositions
        ])
      })
    }
  )
})
