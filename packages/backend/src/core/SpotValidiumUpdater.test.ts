import {
  FullWithdrawal,
  SpotCairoOutput,
  SpotModification,
  SpotWithdrawal,
} from '@explorer/encoding'
import { InMemoryMerkleStorage, MerkleTree, VaultLeaf } from '@explorer/state'
import { AssetHash, Hash256, PedersenHash, StarkKey } from '@explorer/types'
import { expect, mockFn, mockObject } from 'earljs'

import type { MerkleTreeRepository } from '../peripherals/database/MerkleTreeRepository'
import { StateUpdateRepository } from '../peripherals/database/StateUpdateRepository'
import { UserTransactionRepository } from '../peripherals/database/transactions/UserTransactionRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { SpotBatch } from '../peripherals/starkware/toSpotBatch'
import { Logger } from '../tools/Logger'
import { EMPTY_STATE_HASH, SpotValidiumUpdater } from './SpotValidiumUpdater'

describe(SpotValidiumUpdater.name, () => {
  it('has empty state hash correctly calculated', async function () {
    // calculating hashes is slow :(
    this.timeout(5000)

    const rollupStateRepository = mockObject<MerkleTreeRepository<VaultLeaf>>({
      persist: async () => {},
    })
    const emptyTree = await MerkleTree.create(
      rollupStateRepository,
      31n,
      VaultLeaf.EMPTY
    )
    const emptyHash = await emptyTree.hash()
    expect(emptyHash.toString()).toEqual(EMPTY_STATE_HASH.toString())
  })

  describe(SpotValidiumUpdater.prototype.buildNewVaultLeaves.name, () => {
    it('correctly maps SpotBatch to updated vault leaves', () => {
      const updater = new SpotValidiumUpdater(
        mockObject<StateUpdateRepository>({}),
        mockObject<InMemoryMerkleStorage<VaultLeaf>>(),
        mockObject<EthereumClient>(),
        mockObject<UserTransactionRepository>(),
        Logger.SILENT,
        mockObject<MerkleTree<VaultLeaf>>()
      )
      const newVaultA = {
        vaultId: 5n,
        starkKey: StarkKey.fake('5'),
        assetHash: AssetHash.fake('678'),
        balance: 555n,
      }
      const newVaultB = {
        vaultId: 2n,
        starkKey: StarkKey.fake('88'),
        assetHash: AssetHash.fake('54321'),
        balance: 10999n,
      }
      const mockSpotBatch = mockObject<SpotBatch>({
        vaults: [newVaultA, newVaultB],
      })

      const newVaultLeaves = updater.buildNewVaultLeaves(mockSpotBatch)
      expect(newVaultLeaves).toEqual([
        {
          index: newVaultA.vaultId,
          value: new VaultLeaf(
            newVaultA.starkKey,
            newVaultA.balance,
            newVaultA.assetHash
          ),
        },
        {
          index: newVaultB.vaultId,
          value: new VaultLeaf(
            newVaultB.starkKey,
            newVaultB.balance,
            newVaultB.assetHash
          ),
        },
      ])
    })
  })

  describe(
    SpotValidiumUpdater.prototype.processSpotValidiumStateTransition.name,
    () => {
      it('calls processStateTransition with updated vaults', async () => {
        const storage = new InMemoryMerkleStorage<VaultLeaf>()
        const stateTree = await MerkleTree.create(storage, 3n, VaultLeaf.EMPTY)

        const updater = new SpotValidiumUpdater(
          mockObject<StateUpdateRepository>({
            findLast: async () => undefined,
          }),
          storage,
          mockObject<EthereumClient>(),
          mockObject<UserTransactionRepository>(),
          Logger.SILENT,
          stateTree
        )

        const mockProcessStateTransition = mockFn()
        mockProcessStateTransition.returns(Promise.resolve())
        updater.processStateTransition = mockProcessStateTransition

        const validiumStateTransition = {
          stateTransitionHash: Hash256.fake('123'),
          blockNumber: 100,
          transactionHash: Hash256.fake('345'),
          sequenceNumber: 1,
          batchId: 2,
        }
        const fullWithdrawalModification: FullWithdrawal = {
          type: 'fullWithdrawal',
          starkKey: StarkKey.fake(),
          assetHash: AssetHash.fake(),
          vaultId: 300n,
          balanceDifference: 345n,
        }
        const regularWithdrawalModification: SpotWithdrawal = {
          type: 'spotWithdrawal',
          starkKey: StarkKey.fake(),
          assetHash: AssetHash.fake(),
          vaultId: 400n,
          balanceDifference: -123n,
        }

        const modifications: SpotModification[] = [
          regularWithdrawalModification,
          fullWithdrawalModification,
        ]
        const mockSpotCairoOutput = mockObject<SpotCairoOutput>({
          finalValidiumVaultRoot: PedersenHash.fake('987'),
          modifications,
        })
        const newVault = {
          vaultId: 5n,
          starkKey: StarkKey.fake('5'),
          assetHash: AssetHash.fake('678'),
          balance: 555n,
        }
        const mockSpotBatch = mockObject<SpotBatch>({
          vaults: [newVault],
        })
        await updater.processSpotValidiumStateTransition(
          validiumStateTransition,
          mockSpotCairoOutput,
          mockSpotBatch
        )

        expect(mockProcessStateTransition).toHaveBeenCalledWith(
          {
            id: 1,
            blockNumber: validiumStateTransition.blockNumber,
            stateTransitionHash: validiumStateTransition.stateTransitionHash,
          },
          mockSpotCairoOutput.finalValidiumVaultRoot,
          [fullWithdrawalModification],
          [],
          [
            {
              index: newVault.vaultId,
              value: new VaultLeaf(
                newVault.starkKey,
                newVault.balance,
                newVault.assetHash
              ),
            },
          ]
        )
      })
    }
  )
})
