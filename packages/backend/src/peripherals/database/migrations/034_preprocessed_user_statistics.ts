/*
                      ====== IMPORTANT NOTICE ======

DO NOT EDIT OR RENAME THIS FILE

This is a migration file. Once created the file should not be renamed or edited,
because migrations are only run once on the production server. 

If you find that something was incorrectly set up in the `up` function you
should create a new migration file that fixes the issue.

*/

import { Knex } from 'knex'

const PREPROCESSED_USER_STATISTICS_TABLE_NAME = 'preprocessed_user_statistics'

export async function up(knex: Knex) {
  await knex.schema.createTable(
    PREPROCESSED_USER_STATISTICS_TABLE_NAME,
    (table) => {
      table.increments('id').primary()
      table
        .integer('state_update_id')
        .notNullable()
        .references('state_update_id')
        .inTable('preprocessed_state_updates')
      table.integer('block_number').notNullable()
      table.bigInteger('timestamp').notNullable()
      table.string('stark_key').notNullable()
      table.bigInteger('asset_count').notNullable()
      table.bigInteger('balance_change_count').notNullable()
      // Not adding ethereum transactions count because it's
      // independent of state updates.
      table.integer('prev_history_id') // this is for potential future optimizations
      // .references('id')
      // .inTable('preprocessed_asset_history')
      // ^^ Not self-referencing, because it makes queries much slower
      // and testing difficult.

      table.index(['stark_key', 'state_update_id'])
    }
  )
}

export async function down(knex: Knex) {
  await knex.schema.dropTable(PREPROCESSED_USER_STATISTICS_TABLE_NAME)
}
