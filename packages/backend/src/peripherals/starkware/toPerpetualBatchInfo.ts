import { PerpetualL2TransactionData } from '@explorer/shared'
import { PedersenHash, Timestamp } from '@explorer/types'

import { PerpetualBatchInfoResponse } from './schema/PerpetualBatchInfoResponse'
import { toPerpetualL2TransactionData } from './toPerpetualTransactions'

export interface PerpetualBatchInfo {
  sequenceNumber: number
  previousPositionRoot: PedersenHash
  positionRoot: PedersenHash
  orderRoot: PedersenHash
  previousBatchId: number
  transactionsInfo: {
    wasReplaced: boolean
    originalTransactionId: number
    originalTransaction: PerpetualL2TransactionData
    alternativeTransactions?: PerpetualL2TransactionData[]
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
