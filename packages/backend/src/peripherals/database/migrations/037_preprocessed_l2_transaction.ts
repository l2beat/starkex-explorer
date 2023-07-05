/*
                      ====== IMPORTANT NOTICE ======

DO NOT EDIT OR RENAME THIS FILE

This is a migration file. Once created the file should not be renamed or edited,
because migrations are only run once on the production server. 

If you find that something was incorrectly set up in the `up` function you
should create a new migration file that fixes the issue.

*/
import { Knex } from 'knex'

const tableNames = [
  'preprocessed_state_details',
  'preprocessed_user_statistics',
]
const columnNames = [
  'l2_transaction_count',
  'l2_replaced_transaction_count',
  'l2_multi_transaction_count',
]

export async function up(knex: Knex) {
  for (const tableName of tableNames) {
    await knex.schema.alterTable(tableName, (table) => {
      columnNames.forEach((columnName) => {
        table.integer(columnName).nullable()
      })
    })
  }
}

export async function down(knex: Knex) {
  for (const tableName of tableNames) {
    await knex.schema.alterTable(tableName, (table) => {
      table.dropColumns(...columnNames)
    })
  }
}
