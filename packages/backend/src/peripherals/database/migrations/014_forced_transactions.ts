/*
                      ====== IMPORTANT NOTICE ======

DO NOT EDIT OR RENAME THIS FILE

This is a migration file. Once created the file should not be renamed or edited,
because migrations are only run once on the production server. 

If you find that something was incorrectly set up in the `up` function you
should create a new migration file that fixes the issue.

*/

import { Knex } from 'knex'

import { up as createForcedTransactionEvents } from './012_forced_transaction_events'

export async function up(knex: Knex) {
  await knex.schema.dropTableIfExists('forced_transaction_events')
  await knex.schema.createTable('forced_transactions', (table) => {
    table.string('hash').notNullable().index()
    table.string('type').notNullable().index()
    table.jsonb('data').notNullable()
    table.string('data_hash').notNullable().index()
    table
      .integer('state_update_id')
      .references('id')
      .inTable('state_updates')
      .onDelete('set null')
  })
}

export async function down(knex: Knex) {
  await knex.schema.dropTable('forced_transactions')
  await createForcedTransactionEvents(knex)
}
