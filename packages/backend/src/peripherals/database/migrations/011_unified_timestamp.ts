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
  await knex.schema.alterTable('state_updates', (table) => {
    table.bigInteger('timestamp').notNullable().alter()
  })
  await knex.schema.alterTable('rollup_parameters', (table) => {
    table.bigInteger('timestamp').notNullable().alter()
  })
}

export async function down(knex: Knex) {
  await knex('state_updates').delete()
  await knex.schema.alterTable('state_updates', (table) => {
    table.integer('timestamp').notNullable().alter()
  })
  await knex('rollup_parameters').delete()
  await knex.schema.alterTable('rollup_parameters', (table) => {
    table.integer('timestamp').notNullable().alter()
  })
}
