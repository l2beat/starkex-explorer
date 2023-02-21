/*
                      ====== IMPORTANT NOTICE ======

DO NOT EDIT OR RENAME THIS FILE

This is a migration file. Once created the file should not be renamed or edited,
because migrations are only run once on the production server. 

If you find that something was incorrectly set up in the `up` function you
should create a new migration file that fixes the issue.

*/

import { Knex } from 'knex'

const WITHDRAWABLE_ASSETS_TABLE_NAME = 'withdrawable_assets'

export async function up(knex: Knex) {
  await knex.schema.createTable(WITHDRAWABLE_ASSETS_TABLE_NAME, (table) => {
    table.increments('id').primary() // sequential id - allows event ordering
    table.integer('block_number').notNullable().index(), // index for discardAfter
      table.bigInteger('timestamp').notNullable()
    table.string('stark_key').notNullable().index()
    table.string('asset_hash').notNullable()
    // Delta is negative for withdrawals and positive when item added to withdrawable assets
    table.bigInteger('balance_delta').notNullable() // this is quantized amount, as expected in our system
    table.string('transaction_hash').notNullable()
    table.json('event_data').notNullable()
  })
}

export async function down(knex: Knex) {
  await knex.schema.dropTable(WITHDRAWABLE_ASSETS_TABLE_NAME)
}
