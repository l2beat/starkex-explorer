import { EthereumAddress, StarkKey } from '@explorer/types'
import { Knex } from 'knex'
import { UserRegistrationEventRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { BaseRepository } from './BaseRepository'

export type UserRegistrationEventRecord = {
  id: number
  blockNumber: number
  ethAddress: EthereumAddress
  starkKey: StarkKey
}

export class UserRegistrationEventRepository extends BaseRepository {
  constructor(knex: Knex, logger: Logger) {
    super(knex, logger)
    this.addMany = this.wrapAddMany(this.addMany)
    this.getAll = this.wrapGet(this.getAll)
    this.deleteAfter = this.wrapDelete(this.deleteAfter)
    this.deleteAll = this.wrapDelete(this.deleteAll)
    this.findByStarkKey = this.wrapFind(this.findByStarkKey)
  }

  async addMany(records: Omit<UserRegistrationEventRecord, 'id'>[]) {
    const rows = records.map(toRow)
    return this.knex('user_registration_events').insert(rows).returning('id')
  }

  async getAll(): Promise<UserRegistrationEventRecord[]> {
    const rows = await this.knex('user_registration_events').select('*')
    return rows.map(toRecord)
  }

  async deleteAfter(blockNumber: number) {
    return await this.knex('user_registration_events')
      .where('block_number', '>', blockNumber)
      .delete()
  }

  async deleteAll() {
    return this.knex('user_registration_events').delete()
  }

  async findByStarkKey(starkKey: StarkKey) {
    const row = await this.knex('user_registration_events')
      .first('*')
      .orderBy('block_number', 'desc')
      .where('stark_key', starkKey.toString())
    return row ? toRecord(row) : undefined
  }

  async findByEthereumAddress(
    ethereumAddress: EthereumAddress
  ): Promise<UserRegistrationEventRecord | undefined> {
    const row = await this.knex('user_registration_events')
      .first('*')
      .orderBy('block_number', 'desc')
      .where('eth_address', ethereumAddress.toString())
    return row ? toRecord(row) : undefined
  }
}

function toRow(
  record: Omit<UserRegistrationEventRecord, 'id'>
): Omit<UserRegistrationEventRow, 'id'> {
  return {
    block_number: record.blockNumber,
    eth_address: record.ethAddress.toString(),
    stark_key: record.starkKey.toString(),
  }
}

function toRecord(row: UserRegistrationEventRow): UserRegistrationEventRecord {
  return {
    id: row.id,
    blockNumber: row.block_number,
    ethAddress: EthereumAddress(row.eth_address),
    starkKey: StarkKey(row.stark_key),
  }
}
