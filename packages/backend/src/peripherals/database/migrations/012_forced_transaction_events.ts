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
  await knex.schema.createTable('forced_transaction_events', (table) => {
    table.increments('id').primary()
    table.string('transaction_hash').notNullable().index()
    table.string('transaction_type').notNullable().index()
    table.string('event_type').notNullable().index()
    table.integer('block_number').index()
    table.bigInteger('timestamp').notNullable()
    table.jsonb('data').notNullable()
  })
}

export async function down(knex: Knex) {
  await knex.schema.dropTable('forced_transaction_events')
}
