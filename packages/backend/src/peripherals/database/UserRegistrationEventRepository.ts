import { EthereumAddress, StarkKey } from '@explorer/types'
import { UserRegistrationEventRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { BaseRepository } from './shared/BaseRepository'
import { Database } from './shared/Database'

export interface UserRegistrationEventRecord {
  id: number
  blockNumber: number
  ethAddress: EthereumAddress
  starkKey: StarkKey
}

export class UserRegistrationEventRepository extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)

    /* eslint-disable @typescript-eslint/unbound-method */

    this.addMany = this.wrapAddMany(this.addMany)
    this.getAll = this.wrapGet(this.getAll)
    this.deleteAfter = this.wrapDelete(this.deleteAfter)
    this.deleteAll = this.wrapDelete(this.deleteAll)
    this.findByStarkKey = this.wrapFind(this.findByStarkKey)

    /* eslint-enable @typescript-eslint/unbound-method */
  }

  async addMany(records: Omit<UserRegistrationEventRecord, 'id'>[]) {
    const rows = records.map(toRow)
    const knex = await this.knex()
    const ids = await knex('user_registration_events')
      .insert(rows)
      .returning('id')
    return ids.map((x) => x.id)
  }

  async getAll(): Promise<UserRegistrationEventRecord[]> {
    const knex = await this.knex()
    const rows = await knex('user_registration_events').select('*')
    return rows.map(toRecord)
  }

  async deleteAfter(blockNumber: number) {
    const knex = await this.knex()
    return await knex('user_registration_events')
      .where('block_number', '>', blockNumber)
      .delete()
  }

  async deleteAll() {
    const knex = await this.knex()
    return knex('user_registration_events').delete()
  }

  async findByStarkKey(starkKey: StarkKey) {
    const knex = await this.knex()
    const row = await knex('user_registration_events')
      .first('*')
      .orderBy('block_number', 'desc')
      .where('stark_key', starkKey.toString())
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return row ? toRecord(row) : undefined
  }

  async findByEthereumAddress(
    ethereumAddress: EthereumAddress
  ): Promise<UserRegistrationEventRecord | undefined> {
    const knex = await this.knex()
    const row = await knex('user_registration_events')
      .first('*')
      .orderBy('block_number', 'desc')
      .where('eth_address', ethereumAddress.toString())
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
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
