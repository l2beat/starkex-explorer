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
  await knex.schema.createTable('token_registrations', (table) => {
    table.string('asset_type_hash').primary()
    table.string('address').notNullable()
    table.string('type').notNullable()
    table.string('name')
    table.string('symbol')
    table.integer('quantum').notNullable()
    table.integer('decimals')
    table.string('contract_error')
  })
  await knex.schema.createTable('tokens', (table) => {
    table.string('asset_type_hash').primary().references('asset_type_hash').inTable('token_registrations').onDelete('CASCADE')
    table.string('asset_hash').notNullable()
    table.string('token_id')
    table.string('uri')
    table.string('contract_error')
  })
}

export async function down(knex: Knex) {
  await knex.schema.dropTable('tokens')
  await knex.schema.dropTable('token_registrations')
}
