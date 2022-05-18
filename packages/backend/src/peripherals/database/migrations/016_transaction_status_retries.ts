/*
                      ====== IMPORTANT NOTICE ======

DO NOT EDIT OR RENAME THIS FILE

This is a migration file. Once created the file should not be renamed or edited,
because migrations are only run once on the production server. 

If you find that something was incorrectly set up in the `up` function you
should create a new migration file that fixes the issue.

*/

import { Knex } from 'knex'

import { NOT_FOUND_RETRIES } from '../TransactionStatusRepository'

export async function up(knex: Knex) {
  await knex.schema.alterTable('transaction_status', (table) => {
    table
      .integer('not_found_retries')
      .notNullable()
      .defaultTo(NOT_FOUND_RETRIES)
  })
}

export async function down(knex: Knex) {
  await knex.schema.alterTable('transaction_status', (table) => {
    table.dropColumn('not_found_retries')
  })
}
