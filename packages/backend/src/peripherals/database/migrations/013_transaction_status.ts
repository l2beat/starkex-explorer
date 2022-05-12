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
  await knex.schema.createTable('transaction_status', (table) => {
    table.string('hash').primary()
    table.bigInteger('created_at')
    table.bigInteger('mined_at')
    table.bigInteger('reverted_at')
    table.bigInteger('forgotten_at')
    table.integer('block_number').index()
  })
}

export async function down(knex: Knex) {
  await knex.schema.dropTable('transaction_status')
}
