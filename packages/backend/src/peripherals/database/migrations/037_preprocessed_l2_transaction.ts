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
  await knex.schema.alterTable('preprocessed_state_details', (table) => {
    table.jsonb('l2_transactions_statistics')
    table.jsonb('cumulative_l2_transactions_statistics')
  })

  await knex.schema.alterTable('preprocessed_user_statistics', (table) => {
    table.jsonb('l2_transactions_statistics')
  })
}

export async function down(knex: Knex) {
  await knex.schema.alterTable('preprocessed_state_details', (table) => {
    table.dropColumns(
      'l2_transactions_statistics',
      'cumulative_l2_transactions_statistics'
    )
  })

  await knex.schema.alterTable('preprocessed_user_statistics', (table) => {
    table.dropColumn('l2_transactions_statistics')
  })
}
