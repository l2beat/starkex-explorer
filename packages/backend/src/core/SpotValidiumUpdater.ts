import { StarkExDexOutput } from '@explorer/encoding'
import { SpotState, VaultLeaf } from '@explorer/state'
import { Hash256, PedersenHash } from '@explorer/types'

import { ForcedTransactionsRepository } from '../peripherals/database/ForcedTransactionsRepository'
import { SpotStateRepository } from '../peripherals/database/SpotStateRepository'
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

export const ROLLUP_STATE_EMPTY_HASH = PedersenHash(
  '0075364111a7a336756626d19fc8ec8df6328a5e63681c68ffaa312f6bf98c5c'
)

export class SpotValidiumUpdater extends StateUpdater {
  constructor(
    protected readonly stateUpdateRepository: StateUpdateRepository,
    protected readonly spotStateRepository: SpotStateRepository,
    protected readonly ethereumClient: EthereumClient,
    protected readonly forcedTransactionsRepository: ForcedTransactionsRepository,
    protected readonly logger: Logger,
    protected state?: SpotState
  ) {
    super(
      stateUpdateRepository,
      spotStateRepository,
      ethereumClient,
      forcedTransactionsRepository,
      logger,
      ROLLUP_STATE_EMPTY_HASH,
      state
    )
  }

  async processSpotValidiumStateTransition(
    transition: ValidiumStateTransition,
    dexOutput: StarkExDexOutput,
    batch: SpotBatch
  ) {
    const { oldHash, id } = await this.readLastUpdate()
    await this.ensureSpotState(oldHash, 31n)

    const newVaults = this.buildNewVaultLeaves(batch)

    await this.processStateTransition(
      {
        id: id + 1,
        blockNumber: transition.blockNumber,
        stateTransitionHash: transition.stateTransitionHash,
      },
      dexOutput.finalValidiumVaultRoot,
      [], // TODO: add forced actions,
      [],
      [],
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
