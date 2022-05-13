import { ForcedAction, ForcedTrade, ForcedWithdrawal } from '@explorer/encoding'
import { AssetId, Hash256, json, StarkKey, Timestamp } from '@explorer/types'
import { Knex } from 'knex'
import { ForcedTransactionRow, TransactionStatusRow } from 'knex/types/tables'
import { MD5 as hashData } from 'object-hash'

import { Logger } from '../../tools/Logger'

function toSerializableJson(data: object): json {
  return Object.entries(data).reduce((acc, [key, val]) => {
    return {
      ...acc,
      [key]: typeof val === 'bigint' ? val.toString() : val,
    }
  }, {})
}

type WithdrawalData = Omit<ForcedWithdrawal, 'type'>
type TradeData = Omit<ForcedTrade, 'type'>

interface TransactionBase {
  hash: Hash256
  lastUpdate: Timestamp
}
interface TradeBase extends TradeData, TransactionBase {
  type: 'trade'
}
interface WithdrawalBase extends WithdrawalData, TransactionBase {
  type: 'withdrawal'
}

interface SentBase {
  status: 'sent'
  sentAt: Timestamp
}

interface MinedBase {
  status: 'mined'
  sentAt?: Timestamp
  minedAt: Timestamp
}

interface RevertedBase {
  status: 'reverted'
  sentAt: Timestamp
  revertedAt: Timestamp
}

interface ForgottenBase {
  status: 'forgotten'
  sentAt: Timestamp
  forgottenAt: Timestamp
}

interface VerifiedBase {
  status: 'verified'
  sentAt?: Timestamp
  minedAt: Timestamp
  verifiedAt: Timestamp
  stateUpdateId: number
}

interface SentTrade extends SentBase, TradeBase {}
interface MinedTrade extends MinedBase, TradeBase {}
interface RevertedTrade extends RevertedBase, TradeBase {}
interface ForgottenTrade extends ForgottenBase, TradeBase {}
interface VerifiedTrade extends VerifiedBase, TradeBase {}
type Trade =
  | SentTrade
  | MinedTrade
  | RevertedTrade
  | ForgottenTrade
  | VerifiedTrade

interface SentWithdrawal extends SentBase, WithdrawalBase {}
interface MinedWithdrawal extends MinedBase, WithdrawalBase {}
interface RevertedWithdrawal extends RevertedBase, WithdrawalBase {}
interface ForgottenWithdrawal extends ForgottenBase, WithdrawalBase {}
interface VerifiedWithdrawal extends VerifiedBase, WithdrawalBase {}
type Withdrawal =
  | SentWithdrawal
  | MinedWithdrawal
  | RevertedWithdrawal
  | ForgottenWithdrawal
  | VerifiedWithdrawal

export type ForcedTransaction = Withdrawal | Trade

function withdrawalDataFromJson(jsonData: json): WithdrawalData {
  const data = Object(jsonData)
  return {
    publicKey: StarkKey(data.publicKey),
    amount: BigInt(data.amount),
    positionId: BigInt(data.positionId),
  }
}

function tradeDataFromJson(jsonData: json): TradeData {
  const data = Object(jsonData)
  return {
    publicKeyA: StarkKey(data.publicKeyA),
    publicKeyB: StarkKey(data.publicKeyB),
    positionIdA: BigInt(data.positionIdA),
    positionIdB: BigInt(data.positionIdB),
    collateralAmount: BigInt(data.collateralAmount),
    syntheticAmount: BigInt(data.syntheticAmount),
    isABuyingSynthetic: Boolean(data.isABuyingSynthetic),
    syntheticAssetId: AssetId(data.syntheticAssetId),
    nonce: BigInt(data.nonce),
  }
}

type StatusWithTimestamps =
  | {
      status: 'verified'
      sentAt?: Timestamp
      minedAt: Timestamp
      verifiedAt: Timestamp
    }
  | {
      status: 'mined'
      sentAt?: Timestamp
      minedAt: Timestamp
    }
  | { status: 'reverted'; sentAt: Timestamp; revertedAt: Timestamp }
  | { status: 'forgotten'; sentAt: Timestamp; forgottenAt: Timestamp }
  | { status: 'sent'; sentAt: Timestamp }

function getStatusWithTimestamps({
  mined_at,
  reverted_at,
  sent_at,
  verified_at,
  forgotten_at,
}: Row): StatusWithTimestamps {
  const sentAt = sent_at ? Timestamp(sent_at) : undefined
  const minedAt = mined_at ? Timestamp(mined_at) : undefined
  const revertedAt = reverted_at ? Timestamp(reverted_at) : undefined
  const verifiedAt = verified_at ? Timestamp(verified_at) : undefined
  const forgottenAt = forgotten_at ? Timestamp(forgotten_at) : undefined

  if (verifiedAt && minedAt) {
    return {
      status: 'verified',
      sentAt,
      minedAt,
      verifiedAt,
    }
  }
  if (minedAt) {
    return {
      status: 'mined',
      sentAt,
      minedAt,
    }
  }
  if (sentAt && revertedAt) {
    return { status: 'reverted', sentAt, revertedAt }
  }
  if (sentAt && forgottenAt) {
    return { status: 'forgotten', sentAt, forgottenAt }
  }
  if (sentAt) {
    return { status: 'sent', sentAt }
  }

  throw new Error('Cannot determine status and timestamps')
}

function getLastUpdate({
  mined_at,
  reverted_at,
  sent_at,
  verified_at,
}: Row): Timestamp {
  const max = [mined_at, reverted_at, sent_at, verified_at].reduce<bigint>(
    (m, e) => (!!e && e > m ? e : m),
    0n
  )
  return Timestamp(max)
}

type TransactionType = 'withdrawal' | 'trade'

function getType(type: Row['type']): TransactionType {
  if (type === 'trade') {
    return 'trade'
  } else if (type === 'withdrawal') {
    return 'withdrawal'
  }
  throw new Error('Cannot determine type: ' + type)
}

interface Row
  extends ForcedTransactionRow,
    Omit<TransactionStatusRow, 'block_number' | 'hash'> {
  verified_at: bigint
}

function toRecord(row: Row): ForcedTransaction {
  const type = getType(row.type)
  if (type === 'trade') {
    const record = {
      type,
      hash: Hash256(row.hash),
      lastUpdate: getLastUpdate(row),
      ...getStatusWithTimestamps(row),
      ...tradeDataFromJson(row.data),
    }
    if (record.status === 'verified') {
      return { ...record, stateUpdateId: Number(row.state_update_id) }
    }
    return record
  } else {
    const record = {
      type,
      hash: Hash256(row.hash),
      lastUpdate: getLastUpdate(row),
      ...getStatusWithTimestamps(row),
      ...withdrawalDataFromJson(row.data),
    }
    if (record.status === 'verified') {
      return { ...record, stateUpdateId: Number(row.state_update_id) }
    }
    return record
  }
}

export class ForcedTransactionsRepository {
  constructor(private knex: Knex, private logger: Logger) {
    this.logger = logger.for(this)
  }

  async deleteAll(): Promise<void> {
    await this.knex.transaction(async (trx) => {
      const hashes = await trx('forced_transactions').select('hash')
      await trx('forced_transactions').delete()
      await trx('transaction_status')
        .whereIn(
          'hash',
          hashes.map((h) => h.toString())
        )
        .delete()
    })
  }

  private rowsQuery() {
    return this.knex('forced_transactions')
      .innerJoin(
        'transaction_status',
        'transaction_status.hash',
        'forced_transactions.hash'
      )
      .leftJoin(
        'state_updates',
        'state_updates.id',
        'forced_transactions.state_update_id'
      )
      .select(
        'forced_transactions.*',
        'state_updates.timestamp as verified_at',
        'transaction_status.mined_at',
        'transaction_status.sent_at',
        'transaction_status.reverted_at',
        'transaction_status.forgotten_at'
      )
  }

  async getLatest({
    limit,
    offset,
  }: {
    limit: number
    offset: number
  }): Promise<ForcedTransaction[]> {
    // TODO: paginate in sql
    const rows = await this.rowsQuery()
    const transactions = rows.map(toRecord)
    transactions.sort((a, b) => +a.lastUpdate - +b.lastUpdate)
    return transactions.slice(offset, offset + limit)
  }

  async getIncludedInStateUpdate(
    stateUpdateId: number
  ): Promise<ForcedTransaction[]> {
    const rows = await this.rowsQuery().where(
      'state_update_id',
      '=',
      stateUpdateId
    )
    return rows.map(toRecord)
  }

  async getAll(): Promise<ForcedTransaction[]> {
    const rows = await this.rowsQuery()
    return rows.map(toRecord)
  }

  async getAffectingPosition(positionId: bigint): Promise<ForcedTransaction[]> {
    const rows = await this.rowsQuery()
      .whereRaw("data->>'positionId' = ?", String(positionId))
      .orWhereRaw("data->>'positionIdA' = ?", String(positionId))
      .orWhereRaw("data->>'positionIdB' = ?", String(positionId))
    return rows.map(toRecord)
  }

  async getTransactionHashesByData(
    datas: (WithdrawalData | TradeData)[]
  ): Promise<(Hash256 | undefined)[]> {
    if (datas.length === 0) {
      return []
    }
    const hashes = datas.map(hashData)
    const transactions = await this.knex('forced_transactions')
      .whereIn('data_hash', hashes)
      .andWhereRaw('state_update_id is null')
      .orderBy('hash')

    return hashes.map((hash) => {
      const transaction = transactions.find((event) => event.data_hash === hash)
      return transaction ? Hash256(transaction.hash) : undefined
    })
  }

  async countAll(): Promise<bigint> {
    const result = await this.knex('forced_transactions').count()
    return BigInt(result[0].count)
  }

  async findByHash(hash: Hash256): Promise<ForcedTransaction | undefined> {
    const [row] = await this.rowsQuery().where(
      'forced_transactions.hash',
      '=',
      hash.toString()
    )

    if (!row) {
      return undefined
    }

    return toRecord(row)
  }

  async addSent(
    transaction: ForcedAction & {
      hash: Hash256
      sentAt: Timestamp
    }
  ): Promise<void> {
    const { hash, type, sentAt, ...data } = transaction
    await this.knex.transaction(async (trx) => {
      await trx('forced_transactions').insert({
        hash: hash.toString(),
        type,
        data: toSerializableJson(data),
        data_hash: hashData(data),
      })
      await trx('transaction_status').insert({
        hash: hash.toString(),
        sent_at: sentAt ? BigInt(sentAt.toString()) : undefined,
      })
    })
  }

  async addMined(
    transaction: ForcedAction & {
      hash: Hash256
      minedAt: Timestamp
      sentAt?: Timestamp
      blockNumber: number
    }
  ): Promise<void> {
    const { hash, type, blockNumber, minedAt, sentAt, ...data } = transaction
    await this.knex.transaction(async (trx) => {
      await trx('forced_transactions').insert({
        hash: hash.toString(),
        type,
        data: toSerializableJson(data),
        data_hash: hashData(data),
      })
      await trx('transaction_status').insert({
        hash: hash.toString(),
        mined_at: BigInt(minedAt.toString()),
        sent_at: sentAt ? BigInt(sentAt.toString()) : undefined,
        block_number: blockNumber,
      })
    })
  }

  async markAsMined(
    hash: Hash256,
    blockNumber: number,
    minedAt: Timestamp
  ): Promise<void> {
    await this.knex('transaction_status')
      .update({
        block_number: blockNumber,
        mined_at: BigInt(minedAt.toString()),
      })
      .where('hash', '=', hash.toString())
  }
}
