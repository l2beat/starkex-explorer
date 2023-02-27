import {
  decodeFinalizeExitRequest,
  decodeForcedTradeRequest,
  decodeForcedWithdrawalRequest,
} from '@explorer/shared'
import { AssetId, Hash256, Timestamp } from '@explorer/types'

import { BlockRange } from '../../model'
import { Database } from '../../peripherals/database/shared/Database'
import { SoftwareMigrationRepository } from '../../peripherals/database/SoftwareMigrationRepository'
import { SyncStatusRepository } from '../../peripherals/database/SyncStatusRepository'
import { SentTransactionRepository } from '../../peripherals/database/transactions/SentTransactionRepository'
import { UserTransactionRepository } from '../../peripherals/database/transactions/UserTransactionRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { Logger } from '../../tools/Logger'
import { UserTransactionCollector } from '../collectors/UserTransactionCollector'

export class UserTransactionMigrator {
  constructor(
    private database: Database,
    private softwareMigrationRepository: SoftwareMigrationRepository,
    private syncStatusRepository: SyncStatusRepository,
    private userTransactionRepository: UserTransactionRepository,
    private sentTransactionRepository: SentTransactionRepository,
    private userTransactionCollector: UserTransactionCollector,
    private ethereumClient: EthereumClient,
    private logger: Logger
  ) {
    this.logger = this.logger.for(this)
  }

  async migrate(): Promise<void> {
    const migrationNumber =
      await this.softwareMigrationRepository.getMigrationNumber()

    // We want to re-run migration if it was already run when
    // migrationNumber was 0, because the implementation
    // of collector has changed (added spot withdrawals).
    if (
      migrationNumber !== 0 &&
      migrationNumber !== 1 // re-run
    ) {
      return
    }
    await this.migrateUserTransactions()
    await this.softwareMigrationRepository.setMigrationNumber(2)
  }

  private async migrateUserTransactions() {
    const lastSyncedBlock = await this.syncStatusRepository.getLastSynced()
    if (lastSyncedBlock === undefined) {
      return
    }
    this.logger.info('User transactions migration started')

    await this.clearRepositories()
    await this.collectUserTransactions(lastSyncedBlock)
    await this.migrateIncludedTransactions()
    await this.migrateSentTransactions()

    this.logger.info('Migration finished')
  }

  private async clearRepositories() {
    await this.userTransactionRepository.deleteAll()
    await this.sentTransactionRepository.deleteAll()
    this.logger.info('Cleared repositories')
  }

  private async collectUserTransactions(lastSyncedBlock: number) {
    const blockRange = new BlockRange([], 0, lastSyncedBlock)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const timestamps = require('./blockTimestamps.json') as Record<
      number,
      number
    >
    const knownBlockTimestamps = new Map<number, number>(
      Object.entries(timestamps).map(([k, v]) => [parseInt(k), v])
    )
    await this.userTransactionCollector.collect(
      blockRange,
      knownBlockTimestamps
    )
    this.logger.info('Collected user transactions')
  }

  private async migrateIncludedTransactions() {
    const knex = await this.database.getKnex()

    interface Row {
      hash: string
      state_update_id: number
      block_number: number
      timestamp: bigint
    }

    const rows = await knex('forced_transactions')
      .join(
        'state_updates',
        'state_updates.id',
        'forced_transactions.state_update_id'
      )
      .select<Row[]>(
        'forced_transactions.hash',
        'forced_transactions.state_update_id',
        'state_updates.block_number',
        'state_updates.timestamp'
      )

    await this.userTransactionRepository.addManyIncluded(
      rows.map((row) => ({
        transactionHash: Hash256(row.hash),
        stateUpdateId: row.state_update_id,
        blockNumber: row.block_number,
        timestamp: Timestamp(row.timestamp),
      }))
    )
  }

  private async migrateSentTransactions() {
    const knex = await this.database.getKnex()

    const rows = await knex('transaction_status')
      .select('hash', 'sent_at')
      .where('forgotten_at', null)
      .whereNot('sent_at', null)

    const offers = await knex('forced_trade_offers')
      .select('id', 'transaction_hash')
      .whereNot('transaction_hash', null)

    await Promise.all(
      rows.map(async (row) => {
        if (!row.sent_at) {
          return
        }
        const transactionHash = Hash256(row.hash)
        const timestamp = Timestamp(row.sent_at)

        const tx = await this.ethereumClient.getTransaction(transactionHash)
        if (tx === undefined) {
          return
        }

        if (tx.data.startsWith('0x441a3e70')) {
          const data = decodeFinalizeExitRequest(tx.data)
          if (!data) {
            throw new Error('Cannot decode finalize exit request!')
          }
          await this.sentTransactionRepository.add({
            transactionHash,
            timestamp,
            data: {
              type: 'Withdraw',
              starkKey: data.starkKey,
              assetType: data.assetType,
            },
          })
        } else if (tx.data.startsWith('0xaf1437a3')) {
          const data = decodeForcedWithdrawalRequest(tx.data)
          if (!data) {
            throw new Error('Cannot decode forced withdrawal request!')
          }
          await this.sentTransactionRepository.add({
            transactionHash,
            timestamp,
            data: {
              type: 'ForcedWithdrawal',
              quantizedAmount: data.quantizedAmount,
              positionId: data.positionId,
              starkKey: data.starkKey,
              premiumCost: data.premiumCost,
            },
          })
        } else if (tx.data.startsWith('0x2ecb8162')) {
          const data = decodeForcedTradeRequest(tx.data)
          if (!data) {
            throw new Error('Cannot decode forced trade request!')
          }
          const offerId = offers.find(
            (x) => x.transaction_hash === row.hash
          )?.id
          if (!offerId) {
            throw new Error('Cannot find offer!')
          }
          await this.sentTransactionRepository.add({
            transactionHash,
            timestamp,
            data: {
              type: 'ForcedTrade',
              starkKeyA: data.starkKeyA,
              starkKeyB: data.starkKeyB,
              positionIdA: data.positionIdA,
              positionIdB: data.positionIdB,
              collateralAmount: data.collateralAmount,
              collateralAssetId: AssetId.USDC,
              syntheticAmount: data.syntheticAmount,
              syntheticAssetId: data.syntheticAssetId,
              isABuyingSynthetic: data.isABuyingSynthetic,
              submissionExpirationTime: Timestamp(
                data.submissionExpirationTime
              ),
              nonce: data.nonce,
              signatureB: data.signature,
              premiumCost: data.premiumCost,
              offerId,
            },
          })
        } else {
          throw new Error('Unknown transaction data!')
        }

        const receipt = await this.ethereumClient.getTransactionReceipt(
          transactionHash
        )
        const receiptTimestamp = await this.ethereumClient.getBlockTimestamp(
          receipt.blockNumber
        )
        await this.sentTransactionRepository.updateMined(transactionHash, {
          blockNumber: receipt.blockNumber,
          timestamp: Timestamp.fromSeconds(receiptTimestamp),
          reverted: receipt.status === 0,
        })

        this.logger.info('Added sent transaction', {
          transactionHash: transactionHash.toString(),
        })
      })
    )
  }
}
