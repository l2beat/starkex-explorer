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
  await knex.schema.createTable('merkle_nodes', (table) => {
    table.string('hash', 64).primary()
    table.string('left_hash', 64).notNullable()
    table.string('right_hash', 64).notNullable()
  })

  await knex.schema.createTable('merkle_positions', (table) => {
    table.string('hash', 64).primary()
    table.jsonb('data').notNullable()
  })

  await knex.schema.createTable('rollup_parameters', (table) => {
    table.string('root_hash').primary()
    table.integer('timestamp').notNullable()
    table.jsonb('funding').notNullable()
  })
}

export async function down(knex: Knex) {
  await knex.schema.dropTable('merkle_nodes')
  await knex.schema.dropTable('merkle_positions')
  await knex.schema.dropTable('rollup_parameters')
}
