/*
                      ====== IMPORTANT NOTICE ======

DO NOT EDIT OR RENAME THIS FILE

This is a migration file. Once created the file should not be renamed or edited,
because migrations are only run once on the production server. 

If you find that something was incorrectly set up in the `up` function you
should create a new migration file that fixes the issue.

*/

import { Knex } from 'knex'

export async function up(knex: Knex) {
  await knex.schema.createTable('forced_withdraw_transactions', (table) => {
    table.string('hash').primary()
    table.string('stark_key').notNullable()
    table.bigInteger('amount').notNullable()
    table.bigInteger('position_id').notNullable()

    table.index('stark_key')
    table.index('position_id')
  })

  await knex.schema.createTable('forced_withdraw_statuses', (table) => {
    table.string('hash').notNullable()
    table.string('status').notNullable()

    table.bigInteger('timestamp').notNullable()
    table.integer('block_number')
    table.integer('state_update_id')

    table.primary(['hash', 'status'])
    table.index('state_update_id')
  })

  await knex.schema.createTable('forced_trade_transactions', (table) => {
    table.string('hash').primary()
    table.string('stark_key_a').notNullable()
    table.string('stark_key_b').notNullable()
    table.bigInteger('position_id_a').notNullable()
    table.bigInteger('position_id_b').notNullable()
    table.bigInteger('collateral_amount').notNullable()
    table.bigInteger('synthetic_amount').notNullable()
    table.boolean('is_a_buying_synthetic').notNullable()
    table.string('synthetic_asset_id').notNullable()
    table.bigInteger('nonce').notNullable()

    table.index('stark_key_a')
    table.index('stark_key_b')
    table.index('position_id_a')
    table.index('position_id_b')
    table.index('synthetic_asset_id')
  })

  await knex.schema.createTable('forced_trade_statuses', (table) => {
    table.string('hash').notNullable()
    table.string('status').notNullable()

    table.bigInteger('timestamp').notNullable()
    table.integer('block_number')
    table.integer('offer_id')
    table.integer('state_update_id')

    table.primary(['hash', 'status'])
    table.index('offer_id')
    table.index('state_update_id')
  })

  await knex.schema.createTable('withdraw_transactions', (table) => {
    table.string('hash').primary()
    table.string('stark_key').notNullable()
    table.string('asset_type').notNullable()
  })

  await knex.schema.createTable('withdraw_statuses', (table) => {
    table.string('hash').primary()
    table.string('status').notNullable()

    table.bigInteger('timestamp').notNullable()
    table.integer('block_number')
    table.bigInteger('quantized_amount') // TODO: rename?
    table.bigInteger('non_quantized_amount') // TODO: rename?
    table.string('recipient_address')

    table.primary(['hash', 'status'])
    table.index('recipient_address')
  })
}

export async function down(knex: Knex) {
  await knex.schema.dropTable('forced_withdraw_transactions')
  await knex.schema.dropTable('forced_withdraw_statuses')
  await knex.schema.dropTable('forced_trade_transactions')
  await knex.schema.dropTable('forced_trade_statuses')
  await knex.schema.dropTable('withdraw_transactions')
  await knex.schema.dropTable('withdraw_statuses')
}
