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
  await knex.schema.createTable('initial_offers', (table) => {
    table.increments('id').primary()
    table.bigInteger('created_at').notNullable()
    table.bigInteger('submitted_at')
    table.string('stark_key_a').notNullable()
    table.bigInteger('position_id_a').notNullable()
    table.string('synthetic_asset_id').notNullable()
    table.bigInteger('amount_collateral').notNullable()
    table.bigInteger('amount_synthetic').notNullable()
    table.boolean('a_is_buying_synthetic').notNullable()
  })

  await knex.schema.createTable('accept_offers', (table) => {
    table
      .integer('initial_offer_id')
      .notNullable()
      .primary()
      .references('id')
      .inTable('initial_offers')
      .onDelete('CASCADE')

    table.bigInteger('accepted_at')
    table.string('stark_key_b')
    table.bigInteger('position_id_b')
    table.bigInteger('submission_expiration_time')
    table.bigInteger('nonce')
    table.boolean('premium_cost')
    table.string('signature')
  })
}

export async function down(knex: Knex) {
  await knex.schema.dropTable('accept_offers')
  await knex.schema.dropTable('initial_offers')
}
