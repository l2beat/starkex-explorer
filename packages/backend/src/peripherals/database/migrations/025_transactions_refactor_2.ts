/*
                      ====== IMPORTANT NOTICE ======

DO NOT EDIT OR RENAME THIS FILE

This is a migration file. Once created the file should not be renamed or edited,
because migrations are only run once on the production server. 

If you find that something was incorrectly set up in the `up` function you
should create a new migration file that fixes the issue.

*/

import { Knex } from 'knex'
import * as migration24 from './024_transactions_refactor'

export async function up(knex: Knex) {
  await migration24.down(knex)

  await knex.schema.createTable('sent_transactions', (table) => {
    table.string('transaction_hash').primary()
    table.string('type').notNullable().index()
    table.string('stark_key').notNullable().index()
    table.bigInteger('vault_or_position_id').index()
    table.json('data').notNullable()
    table.bigInteger('sent_timestamp').notNullable().index()
    table.bigInteger('mined_timestamp').index()
    table.boolean('reverted').notNullable()
  })

  await knex.schema.createTable('user_events', (table) => {
    table.bigIncrements('id').primary() // surrogate key
    table.string('type').notNullable().index()
    table.string('transaction_hash').notNullable().index()
    table.string('stark_key').notNullable().index()
    table.bigInteger('vault_or_position_id').index()
    table.json('data').notNullable()
    table.integer('block_number').notNullable()
    table.bigInteger('timestamp').notNullable().index()
  })

  await knex.schema.createTable('included_forced_requests', (table) => {
    table.string('transaction_hash').primary()
    table.integer('block_number').notNullable()
    table.bigInteger('timestamp').notNullable()
    table.integer('state_update_id').notNullable()
  })
}

export async function down(knex: Knex) {
  await migration24.up(knex)
  await knex.schema.dropTable('sent_transactions')
  await knex.schema.dropTable('user_events')
  await knex.schema.dropTable('included_forced_requests')
}
