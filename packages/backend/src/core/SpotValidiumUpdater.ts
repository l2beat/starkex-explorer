import { StarkExDexOutput } from '@explorer/encoding'
import { IMerkleStorage, MerkleTree, VaultLeaf } from '@explorer/state'
import { Hash256, PedersenHash } from '@explorer/types'

import { ForcedTransactionsRepository } from '../peripherals/database/ForcedTransactionsRepository'
import { StateUpdateRepository } from '../peripherals/database/StateUpdateRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { SpotBatch } from '../peripherals/starkware/toSpotBatch'
import { Logger } from '../tools/Logger'
import { StateUpdater } from './StateUpdater'

export interface ValidiumStateTransition {
  blockNumber: number
  transactionHash: Hash256
  stateTransitionHash: Hash256
  sequenceNumber: number
  batchId: number
}

export const EMPTY_STATE_HASH = PedersenHash(
  '0075364111a7a336756626d19fc8ec8df6328a5e63681c68ffaa312f6bf98c5c'
)

const vaultTreeHeight = 31n

export class SpotValidiumUpdater extends StateUpdater<VaultLeaf> {
  constructor(
    protected readonly stateUpdateRepository: StateUpdateRepository,
    protected readonly merkleStorage: IMerkleStorage<VaultLeaf>,
    protected readonly ethereumClient: EthereumClient,
    protected readonly forcedTransactionsRepository: ForcedTransactionsRepository,
    protected readonly logger: Logger,
    public stateTree?: MerkleTree<VaultLeaf>
  ) {
    super(
      stateUpdateRepository,
      merkleStorage,
      ethereumClient,
      forcedTransactionsRepository,
      logger,
      EMPTY_STATE_HASH,
      VaultLeaf.EMPTY,
      stateTree
    )
  }

  async processSpotValidiumStateTransition(
    transition: ValidiumStateTransition,
    dexOutput: StarkExDexOutput,
    batch: SpotBatch
  ) {
    const { oldHash, id } = await this.readLastUpdate()
    await this.ensureStateTree(oldHash, vaultTreeHeight)

    const newVaults = this.buildNewVaultLeaves(batch)

    await this.processStateTransition(
      {
        id: id + 1,
        blockNumber: transition.blockNumber,
        stateTransitionHash: transition.stateTransitionHash,
      },
      dexOutput.finalValidiumVaultRoot,
      [], // TODO: add forced actions,
      [], // There are no oracle prices for Spot
      newVaults
    )
  }

  buildNewVaultLeaves(batch: SpotBatch): { index: bigint; value: VaultLeaf }[] {
    return batch.vaults.map((vault) => ({
      index: vault.vaultId,
      value: new VaultLeaf(vault.starkKey, vault.balance, vault.token),
    }))
  }
}
