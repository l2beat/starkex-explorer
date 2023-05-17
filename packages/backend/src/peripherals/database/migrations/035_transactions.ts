/*
                      ====== IMPORTANT NOTICE ======

DO NOT EDIT OR RENAME THIS FILE

This is a migration file. Once created the file should not be renamed or edited,
because migrations are only run once on the production server. 

If you find that something was incorrectly set up in the `up` function you
should create a new migration file that fixes the issue.

*/

import { Knex } from 'knex'

const TRANSACTIONS_TABLE_NAME = 'transactions'

export async function up(knex: Knex) {
  await knex.schema.createTable(TRANSACTIONS_TABLE_NAME, (table) => {
    table.increments('id').primary()
    table.integer('third_party_id').notNullable().index()
    table.integer('transaction_id').notNullable().index()
    table.string('stark_key_a').nullable().index()
    table.string('stark_key_b').nullable().index()
    table.jsonb('data').notNullable()
    table.string('type').notNullable().index()
    table.boolean('is_replaced').notNullable().defaultTo(false)
  })
}

export async function down(knex: Knex) {
  await knex.schema.dropTable(TRANSACTIONS_TABLE_NAME)
}
