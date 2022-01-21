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
  await knex.schema.createTable('state_transition_facts', (table) => {
    table.increments('id').primary()
    table.integer('block_number').notNullable().index()
    table.string('hash').notNullable().index()
  })
}

export async function down(knex: Knex) {
  await knex.schema.dropTable('state_transition_facts')
}
