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
  await knex.schema.createTable('vaults', (table) => {
    table
      .integer('state_update_id')
      .notNullable()
      .index()
      .references('id')
      .inTable('state_updates')
      .onDelete('CASCADE')
    table.bigInteger('vault_id').notNullable()
    table.string('stark_key').notNullable()
    table.string('token').notNullable()
    table.bigInteger('balance').notNullable()
    table.primary(['state_update_id', 'vault_id'])
  })
}

export async function down(knex: Knex) {
  await knex.schema.dropTable('vaults')
}
