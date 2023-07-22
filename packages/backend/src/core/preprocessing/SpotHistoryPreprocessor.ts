import { AssetHash, StarkKey } from '@explorer/types'
import { Logger } from '@l2beat/backend-tools'
import { Knex } from 'knex'

import {
  PreprocessedAssetHistoryRecord,
  PreprocessedAssetHistoryRepository,
} from '../../peripherals/database/PreprocessedAssetHistoryRepository'
import { StateUpdateRecord } from '../../peripherals/database/StateUpdateRepository'
import { VaultRepository } from '../../peripherals/database/VaultRepository'
import { HistoryPreprocessor } from './HistoryPreprocessor'

export class SpotHistoryPreprocessor extends HistoryPreprocessor<AssetHash> {
  constructor(
    protected preprocessedAssetHistoryRepository: PreprocessedAssetHistoryRepository<AssetHash>,
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
        const currentRecords =
          await this.preprocessedAssetHistoryRepository.getCurrentByPositionOrVaultId(
            vault.vaultId,
            trx
          )

        if (currentRecords.length > 1) {
          throw new Error(
            `Found more than one current record for vault ${vault.vaultId}`
          )
        }

        const currentRecord = currentRecords[0]
        if (currentRecord?.balance !== vault.balance) {
          const newRecord: Omit<
            PreprocessedAssetHistoryRecord<AssetHash>,
            'historyId' | 'isCurrent'
          > = {
            stateUpdateId: stateUpdate.id,
            blockNumber: stateUpdate.blockNumber,
            timestamp: stateUpdate.timestamp,
            starkKey: vault.starkKey,
            positionOrVaultId: vault.vaultId,
            assetHashOrId: vault.assetHash,
            balance: vault.balance,
            prevBalance: currentRecord?.balance ?? 0n,
            prevHistoryId: currentRecord?.historyId,
          }
          await this.addNewRecordsAndUpdateIsCurrent(trx, [newRecord])
        }
      }
    }
  }
}
