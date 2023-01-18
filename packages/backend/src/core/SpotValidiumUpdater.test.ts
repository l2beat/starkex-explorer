import { ForcedAction, OraclePrice, SpotCairoOutput } from '@explorer/encoding'
import { InMemoryMerkleStorage, MerkleTree, VaultLeaf } from '@explorer/state'
import { Hash256, PedersenHash, StarkKey } from '@explorer/types'
import { expect, mockFn } from 'earljs'

import { ForcedTransactionRepository } from '../peripherals/database/ForcedTransactionRepository'
import type { MerkleTreeRepository } from '../peripherals/database/MerkleTreeRepository'
import { StateTransitionRecord } from '../peripherals/database/StateTransitionRepository'
import { StateUpdateRepository } from '../peripherals/database/StateUpdateRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { SpotBatch } from '../peripherals/starkware/toSpotBatch'
import { mock } from '../test/mock'
import { Logger } from '../tools/Logger'
import { EMPTY_STATE_HASH, SpotValidiumUpdater } from './SpotValidiumUpdater'

describe(SpotValidiumUpdater.name, () => {
  it('has empty state hash correctly calculated', async function () {
    // calculating hashes is slow :(
    this.timeout(5000)

    const rollupStateRepository = mock<MerkleTreeRepository<VaultLeaf>>({
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
        mock<StateUpdateRepository>({}),
        mock<InMemoryMerkleStorage<VaultLeaf>>(),
        mock<EthereumClient>(),
        mock<ForcedTransactionRepository>(),
        Logger.SILENT,
        mock<MerkleTree<VaultLeaf>>()
      )
      const newVaultA = {
        vaultId: 5n,
        starkKey: StarkKey.fake('5'),
        token: PedersenHash.fake('678'),
        balance: 555n,
      }
      const newVaultB = {
        vaultId: 2n,
        starkKey: StarkKey.fake('88'),
        token: PedersenHash.fake('54321'),
        balance: 10999n,
      }
      const mockSpotBatch = mock<SpotBatch>({
        vaults: [newVaultA, newVaultB],
      })

      const newVaultLeaves = updater.buildNewVaultLeaves(mockSpotBatch)
      expect(newVaultLeaves).toEqual([
        {
          index: newVaultA.vaultId,
          value: new VaultLeaf(
            newVaultA.starkKey,
            newVaultA.balance,
            newVaultA.token
          ),
        },
        {
          index: newVaultB.vaultId,
          value: new VaultLeaf(
            newVaultB.starkKey,
            newVaultB.balance,
            newVaultB.token
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
          mock<StateUpdateRepository>({
            findLast: async () => undefined,
          }),
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
              { index: bigint; value: VaultLeaf }[]
            ]
          >()
        mockProcessStateTransition.returns(Promise.resolve())
        updater.processStateTransition = mockProcessStateTransition

        const validiumStateTransition = {
          stateTransitionHash: Hash256.fake('123'),
          blockNumber: 100,
          transactionHash: Hash256.fake('345'),
          sequenceNumber: 1,
          batchId: 2,
        }
        const mockSpotCairoOutput = mock<SpotCairoOutput>({
          finalValidiumVaultRoot: PedersenHash.fake('987'),
        })
        const newVault = {
          vaultId: 5n,
          starkKey: StarkKey.fake('5'),
          token: PedersenHash.fake('678'),
          balance: 555n,
        }
        const mockSpotBatch = mock<SpotBatch>({
          vaults: [newVault],
        })
        await updater.processSpotValidiumStateTransition(
          validiumStateTransition,
          mockSpotCairoOutput,
          mockSpotBatch
        )

        expect(mockProcessStateTransition).toHaveBeenCalledWith([
          {
            id: 1,
            blockNumber: validiumStateTransition.blockNumber,
            stateTransitionHash: validiumStateTransition.stateTransitionHash,
          },
          mockSpotCairoOutput.finalValidiumVaultRoot,
          [],
          [],
          [
            {
              index: newVault.vaultId,
              value: new VaultLeaf(
                newVault.starkKey,
                newVault.balance,
                newVault.token
              ),
            },
          ],
        ])
      })
    }
  )
})
