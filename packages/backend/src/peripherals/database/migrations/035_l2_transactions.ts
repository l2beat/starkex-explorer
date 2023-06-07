/*
                      ====== IMPORTANT NOTICE ======

DO NOT EDIT OR RENAME THIS FILE

This is a migration file. Once created the file should not be renamed or edited,
because migrations are only run once on the production server. 

If you find that something was incorrectly set up in the `up` function you
should create a new migration file that fixes the issue.

*/

import { Knex } from 'knex'

const L2_TRANSACTIONS_TABLE_NAME = 'l2_transactions'

export async function up(knex: Knex) {
  await knex.schema.createTable(L2_TRANSACTIONS_TABLE_NAME, (table) => {
    table.increments('id').primary()
    table.integer('transaction_id').index()
    table.integer('state_update_id').index()
    table.integer('block_number').index()
    table.integer('parent_id').nullable().defaultTo(null)
    table.string('state').nullable().defaultTo(null)
    table.string('stark_key_a').nullable().index()
    table.string('stark_key_b').nullable().index()
    table.jsonb('data').notNullable()
    table.string('type').notNullable()
  })
}

export async function down(knex: Knex) {
  await knex.schema.dropTable(L2_TRANSACTIONS_TABLE_NAME)
}
