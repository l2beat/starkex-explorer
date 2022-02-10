import { Knex } from 'knex'

export async function up(knex: Knex) {
  await knex.schema.createTable('state_updates', (table) => {
    table.integer('id').primary()
    table.integer('block_number').notNullable().index()
    table.string('fact_hash').notNullable().index()
    table.string('root_hash').notNullable().index()
    table.integer('timestamp').notNullable()
  })

  await knex.schema.createTable('positions', (table) => {
    table
      .integer('state_update_id')
      .notNullable()
      .index()
      .references('id')
      .inTable('state_updates')
      .onDelete('CASCADE')
    table.integer('position_id').notNullable()
    table.string('public_key').notNullable()
    table.bigInteger('collateral_balance').notNullable()
    table.jsonb('balances').notNullable()
    table.primary(['state_update_id', 'position_id'])
  })

  await knex.schema.createTable('prices', (table) => {
    table
      .integer('state_update_id')
      .notNullable()
      .index()
      .references('id')
      .inTable('state_updates')
      .onDelete('CASCADE')
    table.string('asset_id').notNullable()
    table.bigInteger('price').notNullable()
    table.primary(['state_update_id', 'asset_id'])
  })
}

export async function down(knex: Knex) {
  await knex.schema.dropTable('prices')
  await knex.schema.dropTable('positions')

  await knex.schema.dropTable('state_updates')

  await positions_001.up(knex)
}
