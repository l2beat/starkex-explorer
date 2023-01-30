import { StarkKey } from '@explorer/types'
import { PreprocessedAssetHistoryRow } from 'knex/types/tables'

import { PositionRepository } from '../../peripherals/database/PositionRepository'
import { PreprocessedAssetHistoryRepository } from '../../peripherals/database/PreprocessedAssetHistoryRepository'
import { Database } from '../../peripherals/database/shared/Database'
import { StateUpdateRepository } from '../../peripherals/database/StateUpdateRepository'
import { Logger } from '../../tools/Logger'
import { PreprocessingStatusRepository } from './PreprocessingStatusRepository'

export class Preprocessor {
  constructor(
    private database: Database,
    private preprocessingStatusRepository: PreprocessingStatusRepository,
    private preprocessedAssetHistoryRepository: PreprocessedAssetHistoryRepository,
    private stateUpdateRepository: StateUpdateRepository,
    private positionRepository: PositionRepository,
    private logger: Logger
  ) {
    this.logger = this.logger.for(this)
  }

  // Syncs up or down (e.g. reorg) to the current state update
  async sync() {
    this.logger.info('Syncing preprocessed data')

    // TODO: IMPORTANT: during reorg, state update ID doesn't change!!!
    // Always compare block/stateUpdate hash and rollback one by one if necessary
    // and then sync up to the latest state update

    // TODO: should me clear the preprocessingStatusRepository.lastPreprocessedStateUpdate on knex.down? I think we must!

    // TODO position 31 shows many more positions than on cur explorer (on same state update)

    while (!(await this.isSynced())) {
      await this.syncOnce()
    }
  }

  async isSynced(): Promise<boolean> {
    const latestStateUpdate = await this.stateUpdateRepository.findLast()
    if (latestStateUpdate === undefined) {
      return true
    }
    const preprocessedUpdate =
      await this.preprocessingStatusRepository.getLastPreprocessedStateUpdate()
    return preprocessedUpdate === latestStateUpdate.id
  }

  async syncOnce() {
    const latestStateUpdate = await this.stateUpdateRepository.findLast()
    if (latestStateUpdate === undefined) {
      return
    }
    const lastPreprocessedId =
      await this.preprocessingStatusRepository.getLastPreprocessedStateUpdate()
    if (lastPreprocessedId < latestStateUpdate.id) {
      await this.preprocessNextStateTransition()
    } else if (lastPreprocessedId > latestStateUpdate.id) {
      await this.rollbackOnce()
    }
  }

  async rollbackOnce() {
    this.logger.info('Rolling back one state transition')
    let stateUpdateId =
      await this.preprocessingStatusRepository.getLastPreprocessedStateUpdate()
    stateUpdateId--
    await this.preprocessingStatusRepository.setLastPreprocessedStateUpdate(
      stateUpdateId
    )
  }

  async preprocessNextStateTransition() {
    this.logger.info('Preprocessing next state transition')
    let lastPreprocessedId =
      await this.preprocessingStatusRepository.getLastPreprocessedStateUpdate()
    lastPreprocessedId++

    const stateUpdate = await this.stateUpdateRepository.findById(
      lastPreprocessedId
    )
    if (stateUpdate === undefined) {
      throw new Error('State update not found when trying to preprocess data')
    }

    const positions = await this.positionRepository.findByStateUpdateId(
      lastPreprocessedId
    )

    // console.log(positions)
    console.log(lastPreprocessedId)

    await this.preprocessedAssetHistoryRepository.runInTransaction(async (trx) => {
      // BEGIN TRANSACTION:

      for (const position of positions) {
        let updates: {
          token: string
          balance: bigint
          prev_balance?: bigint
          prev_history_id?: number
        }[] = []
        let starkKey = StarkKey.ZERO

        // This is a special case where the position is closed.
        // Due to stark key being zero we need to find it by position ID
        // in current (non-updated) state and fetch active assets
        // and set their balance to zero.
        if (position.starkKey === StarkKey.ZERO) {
          if (position.balances.length !== 0) {
            throw new Error(
              'Closed position (with StarkKey.ZERO) should not have listed balances'
            )
          }
          const curUserAssets =
            await this.preprocessedAssetHistoryRepository.clearCurrentByPositionOrVaultId(
              position.positionId,
              trx
            )
          for (const curUserAsset of curUserAssets) {
            updates.push({
              token: curUserAsset.token,
              balance: 0n,
              prev_balance: curUserAsset.balance,
              prev_history_id: curUserAsset.id,
            })
          }
          if (curUserAssets[0] !== undefined) {
            starkKey = StarkKey(curUserAssets[0].stark_key)
          }
        } else {
          starkKey = position.starkKey
          // USDC (collateral), TODO: make this configurable
          updates = position.balances.map((assetBalance) => ({
            token: assetBalance.assetId.toString(),
            balance: assetBalance.balance,
          }))
          updates.push({
            token: 'USDC',
            balance: position.collateralBalance,
          })
        }

        for (const update of updates) {
          if (
            update.prev_balance === undefined ||
            update.prev_history_id === undefined
          ) {
            const curCollateralRow =
              await this.preprocessedAssetHistoryRepository.clearCurrentByStarkKeyAndTokenId(
                position.starkKey,
                update.token,
                trx
              )
            update.prev_balance = curCollateralRow?.balance ?? 0n
            update.prev_history_id = curCollateralRow?.id
          }
          if (starkKey === StarkKey.ZERO) {
            throw new Error('Stark key should not be zero')
          }
          if (update.balance !== update.prev_balance) {
            const newRow: Omit<PreprocessedAssetHistoryRow, 'id'> = {
              state_update_id: stateUpdate.id,
              block_number: stateUpdate.blockNumber,
              stark_key: starkKey.toString(),
              position_or_vault_id: position.positionId,
              token: update.token,
              token_is_perp: update.token !== 'USDC', // TODO: find better way to do this
              balance: update.balance,
              prev_balance: update.prev_balance,
              is_current: true,
              prev_history_id: update.prev_history_id ?? null,
            }
            await this.preprocessedAssetHistoryRepository.add(newRow, trx)
          }
        }
      }

      await this.preprocessingStatusRepository.setLastPreprocessedStateUpdate(
        lastPreprocessedId,
        trx
      )
      // END TRANSACTION
    })
  }
}
