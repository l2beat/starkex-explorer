import { PedersenHash, Timestamp } from '@explorer/types'

import { L2TransactionData } from '../database/L2Transaction'
import { PerpetualBatchInfoResponse } from './schema'
import { toPerpetualL2TransactionData } from './toPerpetualTransactions'

interface PerpetualBatchInfo {
  sequenceNumber: number
  previousPositionRoot: PedersenHash
  positionRoot: PedersenHash
  orderRoot: PedersenHash
  previousBatchId: number
  transactionsInfo: {
    wasReplaced: boolean
    originalTransactionId: number
    originalTransaction: L2TransactionData
    alternativeTransactions?: L2TransactionData[]
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
      originalTransaction: toPerpetualL2TransactionData(txInfo.original_tx),
      alternativeTransactions: txInfo.alt_txs?.map(
        toPerpetualL2TransactionData
      ),
    })),
    previousOrderRoot: PedersenHash(response.previous_order_root),
    timeCreated: Timestamp(response.time_created),
  }
}
