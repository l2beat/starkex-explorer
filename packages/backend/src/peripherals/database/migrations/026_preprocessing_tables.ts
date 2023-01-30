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
    // TODO: add indexes
    table.increments('id').primary()
    table.integer('state_update_id').notNullable()
    table.integer('block_number').notNullable() // TODO: is this needed?
    table.string('stark_key').notNullable()
    table.bigInteger('position_or_vault_id').notNullable()
    table.string('token').notNullable()
    table.boolean('token_is_perp').notNullable()
    table.bigInteger('balance').notNullable()
    table.bigInteger('prev_balance').notNullable()
    table.boolean('is_current').notNullable()
    table
      .integer('prev_history_id')
      .references('id')
      .inTable('preprocessed_asset_history')
    table.index(['stark_key', 'token', 'balance'], undefined, {
      predicate: knex.whereRaw('is_current = true'),
    })
    table.index(['position_or_vault_id'], undefined, {
      predicate: knex.whereRaw('is_current = true AND balance != 0'),
    })
    table.index(['stark_key', 'state_update_id'])
  })
}

export async function down(knex: Knex) {
  await knex.schema.dropTable('preprocessed_asset_history')
}
