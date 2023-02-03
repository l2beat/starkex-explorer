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
  await knex.schema.createTable('preprocessed_asset_history', (table) => {
    table.increments('id').primary()
    table.integer('state_update_id').notNullable()
    table.integer('block_number').notNullable()
    table.bigInteger('timestamp').notNullable()
    table.string('stark_key').notNullable()
    table.bigInteger('position_or_vault_id').notNullable()
    table.string('token').notNullable()
    table.boolean('token_is_perp').notNullable()
    table.bigInteger('balance').notNullable()
    table.bigInteger('prev_balance').notNullable()
    table.bigInteger('price').notNullable()
    table.bigInteger('prev_price')
    table.boolean('is_current').notNullable()
    table.integer('prev_history_id')
    // TODO: removing self-referential FK for now, because it's slowing queries significantly
    // .references('id')
    // .inTable('preprocessed_asset_history')

    // Index for efficiently querying the current state of an account
    // (i.e. current snapshot represented by is_current=true)
    // 'balance' is included due to frequent 'balance != 0' queries
    table.index(['stark_key', 'balance', 'token'], undefined, {
      predicate: knex.whereRaw('is_current = true'),
    })
    // Index for efficiently finding stark key by current position or vault id
    // - this happens when a position is deleted and stark key is ZERO.
    table.index(['position_or_vault_id'], undefined, {
      predicate: knex.whereRaw('is_current = true AND balance != 0'),
    })
    // Index for efficiently querying history of given use,
    // *ordered* by timestamp descending.
    table.index(['stark_key', 'timestamp'])
  })
}

export async function down(knex: Knex) {
  await knex.schema.dropTable('preprocessed_asset_history')
}
