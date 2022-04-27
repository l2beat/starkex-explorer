import { EthereumAddress } from '@explorer/types'
import { Knex } from 'knex'
import { UserRegistrationEventRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'

export type UserRegistrationEventRecord = {
  id: number
  blockNumber: number
  ethAddress: EthereumAddress
  starkKey: string
}

export type UserRegistrationEventRecordCandidate = Omit<
  UserRegistrationEventRecord,
  'id'
>

function toRowCandidate(
  record: UserRegistrationEventRecordCandidate
): Omit<UserRegistrationEventRow, 'id'> {
  return {
    block_number: record.blockNumber,
    eth_address: record.ethAddress.toString(),
    stark_key: record.starkKey,
  }
}

function toRecord(row: UserRegistrationEventRow): UserRegistrationEventRecord {
  return {
    id: row.id,
    blockNumber: row.block_number,
    ethAddress: EthereumAddress(row.eth_address),
    starkKey: row.stark_key,
  }
}

export class UserRegistrationEventRepository {
  constructor(private knex: Knex, private logger: Logger) {
    this.logger = logger.for(this)
  }

  async add(records: UserRegistrationEventRecordCandidate[]) {
    if (records.length === 0) {
      this.logger.debug({ method: 'add', rows: 0 })
      return
    }

    const rowCandidates = records.map(toRowCandidate)
    await this.knex('user_registration_events').insert(rowCandidates)
    this.logger.debug({ method: 'add', rows: rowCandidates.length })
  }

  async getAll(): Promise<UserRegistrationEventRecord[]> {
    const rows = await this.knex('user_registration_events').select('*')
    this.logger.debug({ method: 'getAll', rows: rows.length })
    return rows.map(toRecord)
  }

  async deleteAllAfter(blockNumber: number) {
    const rowsCount = await this.knex('user_registration_events')
      .where('block_number', '>', blockNumber)
      .delete()

    this.logger.debug({ method: 'deleteAllAfter', rows: rowsCount })
  }

  async deleteAll() {
    await this.knex('user_registration_events').delete()
    this.logger.debug({ method: 'deleteAll' })
  }

  async findByStarkKey(
    starkKey: string
  ): Promise<UserRegistrationEventRecord | undefined> {
    const rows = await this.knex('user_registration_events')
      .select('*')
      .orderBy('block_number', 'desc')
      .where('stark_key', starkKey)
      .limit(1)
    return rows.length > 0 ? toRecord(rows[0]) : undefined
  }

  async findByEthereumAddr(
    ethereumAddress: string
  ): Promise<UserRegistrationEventRecord | undefined> {
    const rows = await this.knex('user_registration_events')
      .select('*')
      .orderBy('block_number', 'desc')
      .where('eth_address', ethereumAddress)
      .limit(1)
    return rows.length > 0 ? toRecord(rows[0]) : undefined
  }
}
