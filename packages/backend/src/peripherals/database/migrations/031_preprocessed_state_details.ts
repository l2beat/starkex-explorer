/*
                      ====== IMPORTANT NOTICE ======

DO NOT EDIT OR RENAME THIS FILE

This is a migration file. Once created the file should not be renamed or edited,
because migrations are only run once on the production server. 

If you find that something was incorrectly set up in the `up` function you
should create a new migration file that fixes the issue.

*/

import { Knex } from 'knex'

const PREPROCESSED_STATE_DETAILS_TABLE_NAME = 'preprocessed_state_details'

export async function up(knex: Knex) {
  await knex.schema.createTable(
    PREPROCESSED_STATE_DETAILS_TABLE_NAME,
    (table) => {
      table.increments('id').primary()
      table
        .integer('state_update_id')
        .notNullable()
        .index() // index for ordering by state_update_id
        .references('state_update_id')
        .inTable('preprocessed_state_updates')
      table.string('state_transition_hash').notNullable()
      table.string('root_hash').notNullable()
      table.integer('block_number').notNullable()
      table.bigInteger('timestamp').notNullable()
      table.integer('asset_update_count').notNullable()
      table.integer('forced_transaction_count').notNullable()
    }
  )
}

export async function down(knex: Knex) {
  await knex.schema.dropTable(PREPROCESSED_STATE_DETAILS_TABLE_NAME)
}
