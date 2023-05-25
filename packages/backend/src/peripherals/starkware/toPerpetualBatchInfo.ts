import { PedersenHash, Timestamp } from '@explorer/types'

import { TransactionData } from '../database/Transaction'
import { PerpetualBatchInfoResponse } from './schema'
import { toPerpetualTransaction } from './toPerpetualTransactions'

interface PerpetualBatchInfo {
  sequenceNumber: number
  previousPositionRoot: PedersenHash
  positionRoot: PedersenHash
  orderRoot: PedersenHash
  previousBatchId: number
  transactionsInfo: {
    wasReplaced: boolean
    originalTransactionId: number
    originalTransaction: TransactionData
    alternativeTransactions?: TransactionData[]
  }[]
  previousOrderRoot: PedersenHash
  timeCreated: Timestamp
}

export function toPerpetualBatchInfo(
  response: PerpetualBatchInfoResponse
): PerpetualBatchInfo {
  return {
    sequenceNumber: response.sequence_number,
    previousPositionRoot: PedersenHash(response.previous_position_root),
    positionRoot: PedersenHash(response.position_root),
    orderRoot: PedersenHash(response.order_root),
    previousBatchId: response.previous_batch_id,
    transactionsInfo: response.txs_info.map((txInfo) => ({
      wasReplaced: txInfo.was_replaced,
      originalTransactionId: txInfo.original_tx_id,
      originalTransaction: toPerpetualTransaction(txInfo.original_tx),
      alternativeTransactions: txInfo.alt_txs?.map(toPerpetualTransaction),
    })),
    previousOrderRoot: PedersenHash(response.previous_order_root),
    timeCreated: Timestamp(response.time_created),
  }
}
