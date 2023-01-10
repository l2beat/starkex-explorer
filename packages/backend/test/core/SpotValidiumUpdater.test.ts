import { ForcedAction, OraclePrice, SpotCairoOutput } from '@explorer/encoding'
import { InMemoryMerkleStorage, MerkleTree, VaultLeaf } from '@explorer/state'
import { Hash256, PedersenHash, StarkKey } from '@explorer/types'
import { expect, mockFn } from 'earljs'

import {
  EMPTY_STATE_HASH,
  SpotValidiumUpdater,
} from '../../src/core/SpotValidiumUpdater'
import { ForcedTransactionRepository } from '../../src/peripherals/database/ForcedTransactionRepository'
import type { MerkleTreeRepository } from '../../src/peripherals/database/MerkleTreeRepository'
import { StateTransitionRecord } from '../../src/peripherals/database/StateTransitionRepository'
import { StateUpdateRepository } from '../../src/peripherals/database/StateUpdateRepository'
import { EthereumClient } from '../../src/peripherals/ethereum/EthereumClient'
import { SpotBatch } from '../../src/peripherals/starkware/toSpotBatch'
import { Logger } from '../../src/tools/Logger'
import { mock } from '../mock'

describe(SpotValidiumUpdater.name, () => {
  it('has empty state hash correcly calculated', async () => {
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
    it('correctly maps SpotBatch to vault', () => {
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
