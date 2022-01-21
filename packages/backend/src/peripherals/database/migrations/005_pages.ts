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
  await knex.schema.createTable('pages', (table) => {
    table.increments('id').primary()
    table.integer('block_number').notNullable().index()
    table.string('page_hash').notNullable().index()
    table.text('data').notNullable()
  })
}

export async function down(knex: Knex) {
  await knex.schema.dropTable('pages')
}
