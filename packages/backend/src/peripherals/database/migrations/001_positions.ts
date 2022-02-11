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
  await knex.schema.createTable('position_updates', (table) => {
    table.bigInteger('position_id').primary()
    table.string('public_key').notNullable()
    table.bigInteger('collateral_balance').notNullable()
    table.bigInteger('funding_timestamp').notNullable()
    table.jsonb('balances').notNullable()
  })
}

export async function down(knex: Knex) {
  await knex.schema.dropTable('position_updates')
}
