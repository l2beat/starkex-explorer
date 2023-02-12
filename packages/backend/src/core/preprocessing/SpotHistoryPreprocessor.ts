import { AssetHash, StarkKey } from '@explorer/types'
import { Knex } from 'knex'

import {
  PreprocessedAssetHistoryRecord,
  PreprocessedAssetHistoryRepository,
} from '../../peripherals/database/PreprocessedAssetHistoryRepository'
import {
  StateUpdateRecord,
  StateUpdateRepository,
} from '../../peripherals/database/StateUpdateRepository'
import { VaultRepository } from '../../peripherals/database/VaultRepository'
import { Logger } from '../../tools/Logger'
import { HistoryPreprocessor } from './HistoryPreprocessor'

export class SpotHistoryPreprocessor extends HistoryPreprocessor<AssetHash> {
  constructor(
    protected preprocessedAssetHistoryRepository: PreprocessedAssetHistoryRepository<AssetHash>,
    private stateUpdateRepository: StateUpdateRepository,
    private vaultRepository: VaultRepository,
    protected logger: Logger
  ) {
    super(preprocessedAssetHistoryRepository, logger)
  }

  async preprocessNextStateUpdate(
    trx: Knex.Transaction,
    stateUpdate: StateUpdateRecord
  ) {
    const vaults = await this.vaultRepository.getByStateUpdateId(
      stateUpdate.id,
      trx
    )

    for (const vault of vaults) {
      if (vault.starkKey === StarkKey.ZERO) {
        await this.closePositionOrVault(trx, vault.vaultId, stateUpdate, {})
      } else {
        const currentRecord = (
          await this.preprocessedAssetHistoryRepository.getCurrentByStarkKeyAndAssets(
            vault.starkKey,
            [vault.assetHash],
            trx
          )
        )[0]

        if (currentRecord?.balance !== vault.balance) {
          const newRecord: Omit<
            PreprocessedAssetHistoryRecord,
            'historyId' | 'isCurrent'
          > = {
            stateUpdateId: stateUpdate.id,
            blockNumber: stateUpdate.blockNumber,
            timestamp: BigInt(Number(stateUpdate.timestamp)),
            starkKey: vault.starkKey,
            positionOrVaultId: vault.vaultId,
            assetHashOrId: vault.assetHash,
            balance: vault.balance,
            prevBalance: currentRecord?.balance ?? 0n,
            prevHistoryId: currentRecord?.historyId,
          }
          await this.addNewRecordsAndMakeThemCurrent(trx, [newRecord])
        }
      }
    }
  }
}
