import { EthereumAddress, PedersenHash, StarkKey } from '@explorer/types'
import { Knex } from 'knex'
import { VaultRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { BaseRepository } from './shared/BaseRepository'
import { Database } from './shared/Database'

export interface VaultRecord {
  vaultId: bigint
  starkKey: StarkKey
  token: PedersenHash
  balance: bigint
}

export class VaultRepository extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)

    /* eslint-disable @typescript-eslint/unbound-method */

    this.findById = this.wrapFind(this.findById)
    this.findIdByStarkKey = this.wrapFind(this.findIdByStarkKey)
    this.findIdByEthereumAddress = this.wrapFind(this.findIdByEthereumAddress)
    this.getByStateUpdateId = this.wrapGet(this.getByStateUpdateId)
    this.getPreviousStates = this.wrapGet(this.getPreviousStates)
    this.count = this.wrapAny(this.count)

    /* eslint-enable @typescript-eslint/unbound-method */
  }

  async findById(vaultId: bigint) {
    const knex = await this.knex()
    const row = await knex('vaults')
      .where('vault_id', vaultId)
      .orderBy('state_update_id', 'desc')
      .first()

    if (row) return toVaultRecord(row)
  }

  async findIdByStarkKey(starkKey: StarkKey): Promise<bigint | undefined> {
    const knex = await this.knex()
    const row = await knex('vaults')
      .where('stark_key', starkKey.toString())
      .first('vault_id')
    return row?.vault_id
  }

  async findIdByEthereumAddress(
    address: EthereumAddress
  ): Promise<bigint | undefined> {
    const knex = await this.knex()
    const row = await knex('user_registration_events')
      .first('vault_id')
      .orderBy('block_number', 'desc')
      .where('eth_address', address.toString())
      .join('vaults', function () {
        this.on('vaults.stark_key', '=', 'user_registration_events.stark_key')
      })
    return row?.vault_id
  }

  async getByStateUpdateId(stateUpdateId: number, trx?: Knex.Transaction) {
    const knex = await this.knex(trx)
    const rows = await knex('vaults').where('state_update_id', stateUpdateId)

    return rows.map((r) => toVaultRecord(r))
  }

  async getPreviousStates(vaultIds: bigint[], stateUpdateId: number) {
    const knex = await this.knex()
    const rows = await knex
      .from('vaults as p1')
      .innerJoin(
        knex
          .select(
            'vault_id',
            knex.raw('max(state_update_id) as prev_state_update_id')
          )
          .from('vaults')
          .as('p2')
          .whereIn('vault_id', vaultIds)
          .andWhere('state_update_id', '<', stateUpdateId)
          .groupBy('vault_id'),
        function () {
          return this.on('p1.vault_id', '=', 'p2.vault_id').andOn(
            'p1.state_update_id',
            '=',
            'p2.prev_state_update_id'
          )
        }
      )
      .groupBy('p1.state_update_id', 'p1.position_id')

    return rows.map(toVaultRecord)
  }

  async count() {
    const knex = await this.knex()
    const [result] = await knex('vaults').countDistinct({
      count: 'vault_id',
    })
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return BigInt(result!.count!)
  }
}

export function toVaultRecord(
  row: VaultRow
): VaultRecord & { stateUpdateId: number } {
  return {
    stateUpdateId: row.state_update_id,
    vaultId: BigInt(row.vault_id),
    token: PedersenHash(row.token),
    starkKey: StarkKey(row.stark_key),
    balance: BigInt(row.balance),
  }
}

export function toVaultRow(
  record: VaultRecord,
  stateUpdateId: number
): VaultRow {
  return {
    state_update_id: stateUpdateId,
    vault_id: record.vaultId,
    stark_key: record.starkKey.toString(),
    token: record.token.toString(),
    balance: record.balance,
  }
}
