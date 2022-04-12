import { AssetId, Timestamp } from '@explorer/types'
import { createHash } from 'crypto'
import { Knex } from 'knex'
import { ForcedTransactionEventRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'

type RecordCandidate = {
  id?: number
  transactionHash: string
  timestamp: Timestamp
}

type MinedWithdrawalData = {
  publicKey: string
  positionId: bigint
  amount: bigint
}

type MinedWithdrawalCandidate = RecordCandidate &
  MinedWithdrawalData & {
    transactionType: 'withdrawal'
    eventType: 'mined'
    blockNumber: number
  }

type Verified = {
  eventType: 'verified'
  stateUpdateId: number
}

type VerifiedWithdrawalCandidate = RecordCandidate &
  Verified & {
    transactionType: 'withdrawal'
    blockNumber: number
  }

type WithdrawalCandidate =
  | MinedWithdrawalCandidate
  | VerifiedWithdrawalCandidate

type MinedTradeData = {
  publicKeyA: string
  publicKeyB: string
  positionIdA: bigint
  positionIdB: bigint
  syntheticAssetId: AssetId
  isABuyingSynthetic: boolean
  collateralAmount: bigint
  syntheticAmount: bigint
}

type MinedTradeCandidate = RecordCandidate &
  MinedTradeData & {
    transactionType: 'trade'
    eventType: 'mined'
    blockNumber: number
  }

type VerifiedTradeCandidate = RecordCandidate &
  Verified & {
    transactionType: 'trade'
    blockNumber: number
  }

type TradeCandidate = MinedTradeCandidate | VerifiedTradeCandidate

type TransactionEventRecordCandidate = TradeCandidate | WithdrawalCandidate

// type TransactionEventRecord = TransactionEventRecordCandidate & {
//   id: ForcedTransactionEventRow['id']
// }

type TransactionEventRowCandidate = Omit<ForcedTransactionEventRow, 'id'> & {
  id?: ForcedTransactionEventRow['id']
}

function toJsonString(data: object) {
  const serializable = Object.entries(data).reduce((acc, [key, val]) => {
    return {
      ...acc,
      [key]: typeof val === 'bigint' ? val.toString() : val,
    }
  }, {})
  return JSON.stringify(serializable)
}

function hashData(data: string): string {
  return createHash('md5').update(data).digest('base64')
}

function recordCandidateToRow(
  candidate: TransactionEventRecordCandidate
): TransactionEventRowCandidate {
  const {
    id,
    transactionHash: transaction_hash,
    transactionType: transaction_type,
    eventType: event_type,
    blockNumber: block_number,
    timestamp,
    ...rest
  } = candidate

  const data =
    event_type === 'mined'
      ? {
          ...rest,
          hash: hashData(toJsonString(rest)),
        }
      : rest

  return {
    id,
    transaction_hash,
    transaction_type,
    event_type,
    block_number,
    timestamp: BigInt(Number(timestamp)),
    data,
  }
}

// function toRecord(row: ForcedTransactionEventRow): TransactionEventRecord {
//   const id = row.id
//   const transactionHash = row.transaction_hash
//   const timestamp = Timestamp(row.timestamp)
//   const data = fromJsonString(row.data)
//   const type = row.transaction_type + '_' + row.event_type
//   switch (type) {
//     case 'withdrawal_mined':
//       return {
//         id,
//         transactionHash,
//         transactionType: 'withdrawal',
//         eventType: 'mined',
//         timestamp,
//         blockNumber: Number(row.block_number),
//         publicKey: String(data.publicKey),
//         positionId: BigInt(data.positionId),
//         amount: BigInt(data.amount),
//       }
//     case 'trade_mined':
//       return {
//         id,
//         transactionHash,
//         transactionType: 'trade',
//         eventType: 'mined',
//         timestamp,
//         blockNumber: Number(row.block_number),
//         publicKeyA: String(data.publicKeyA),
//         publicKeyB: String(data.publicKeyB),
//         positionIdA: BigInt(data.positionIdA),
//         positionIdB: BigInt(data.positionIdB),
//         collateralAmount: BigInt(data.collateralAmount),
//         syntheticAmount: BigInt(data.syntheticAmount),
//         isABuyingSynthetic: Boolean(data.isABuyingSynthetic),
//         syntheticAssetId: AssetId(data.assetId),
//       }
//     case 'withdrawal_verified':
//       return {
//         id,
//         transactionHash,
//         transactionType: 'withdrawal',
//         eventType: 'verified',
//         timestamp,
//         blockNumber: Number(row.block_number),
//         stateUpdateId: Number(data.stateUpdateId),
//       }
//     case 'trade_verified':
//       return {
//         id,
//         transactionHash,
//         transactionType: 'trade',
//         eventType: 'verified',
//         timestamp,
//         blockNumber: Number(row.block_number),
//         stateUpdateId: Number(data.stateUpdateId),
//       }
//     default:
//       throw new Error('Unknown event type: ' + type)
//   }
// }

export class ForcedTransactionsRepository {
  constructor(private knex: Knex, private logger: Logger) {
    this.logger = logger.for(this)
  }

  async addEvents(
    candidates: TransactionEventRecordCandidate[]
  ): Promise<void> {
    if (candidates.length === 0) {
      return
    }
    const rowCandidates = candidates.map(recordCandidateToRow)
    await this.knex('forced_transaction_events').insert(rowCandidates)
    this.logger.debug({
      method: 'addEvents',
      count: candidates.length,
    })
  }

  async getTransactionHashesByMinedEventsData(
    datas: (MinedTradeData | MinedWithdrawalData)[]
  ): Promise<{ dataHash: string; transactionHash: string }[]> {
    if (datas.length === 0) {
      return []
    }
    const hashes = datas.map(toJsonString).map(hashData)
    const records = await this.knex('forced_transaction_events').whereRaw(
      "data->>'hash' in (?)",
      hashes
    )

    return records.map((e) => ({
      dataHash: String(e.data.hash),
      transactionHash: e.transaction_hash,
    }))
  }

  async discardAfter(blockNumber: number): Promise<void> {
    await this.knex('forced_transaction_events')
      .delete()
      .where('block_number', '>', blockNumber)
  }
}
