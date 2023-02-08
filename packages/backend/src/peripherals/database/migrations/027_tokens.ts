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
  await knex.schema.createTable('asset_registrations', (table) => {
    table.string('asset_type_hash').primary()
    table.string('type').notNullable()
    table.string('quantum').notNullable()
    table.string('address')
    table.string('name')
    table.string('symbol')
    table.integer('decimals')
    table.json('contract_error').notNullable()
  })

  await knex.schema.createTable('asset_details', (table) => {
    table.string('asset_hash').primary()
    table.string('asset_type_hash').notNullable()
    table.string('type').notNullable()
    table.string('quantum').notNullable()
    table.string('address')
    table.string('name')
    table.string('symbol')
    table.integer('decimals')
    table.string('token_id')
    table.string('uri')
    table.string('minting_blob')
    table.json('contract_error').notNullable()
  })
}

export async function down(knex: Knex) {
  await knex.schema.dropTable('asset_details')
  await knex.schema.dropTable('asset_registrations')
}
