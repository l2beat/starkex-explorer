/*
                      ====== IMPORTANT NOTICE ======

DO NOT EDIT OR RENAME THIS FILE

This is a migration file. Once created the file should not be renamed or edited,
because migrations are only run once on the production server. 

If you find that something was incorrectly set up in the `up` function you
should create a new migration file that fixes the issue.

*/

import { Knex } from 'knex'

const indexName = 'unique_forced_transaction_event_type'
const columns = ['transaction_hash', 'event_type']

export async function up(knex: Knex) {
  await knex.schema.alterTable('forced_transaction_events', (table) => {
    table.unique(columns, { indexName })
  })
}

export async function down(knex: Knex) {
  await knex.schema.alterTable('forced_transaction_events', (table) => {
    table.dropUnique(columns, indexName)
  })
}
