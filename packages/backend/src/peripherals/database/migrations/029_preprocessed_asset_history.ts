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
    table
      .integer('state_update_id')
      .notNullable()
      .references('state_update_id')
      .inTable('preprocessed_state_updates')
    table.integer('block_number').notNullable()
    table.bigInteger('timestamp').notNullable()
    table.string('stark_key').notNullable()
    table.bigInteger('position_or_vault_id').notNullable()
    table.string('asset_hash_or_id').notNullable()
    table.bigInteger('balance').notNullable()
    table.bigInteger('prev_balance').notNullable()
    table.bigInteger('price') // price can be null for spot tokens
    table.bigInteger('prev_price')
    table.boolean('is_current').notNullable()
    table.integer('prev_history_id')
    // .references('id')
    // .inTable('preprocessed_asset_history')
    // ^^ Not self-referencing, because it makes queries much slower
    // and testing difficult.

    // Index for efficiently querying the current state of an account
    // (i.e. current snapshot represented by is_current=true)
    // It also adds a unique constraint, as we don't expect to
    // have the same asset in multiple vaults/positions
    // for the same user at the same time.
    table.unique(['stark_key', 'asset_hash_or_id'], {
      predicate: knex.whereRaw('is_current = true'),
    })
    // Index for efficiently finding records by current position or vault id
    // - this is needed when a position is deleted and stark key is ZERO.
    table.index(['position_or_vault_id'], undefined, {
      predicate: knex.whereRaw('is_current = true'),
    })
    // Index for efficiently querying history of a given user,
    // *ordered* by timestamp descending.
    table.index(['stark_key', 'timestamp'])
    // Index used on rollback to find the previous state update id
    // and rendering single state update page (hence id is last)
    table.index(['state_update_id', 'id'])
  })
}

export async function down(knex: Knex) {
  await knex.schema.dropTable('preprocessed_asset_history')
}
