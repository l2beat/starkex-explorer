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
  await knex.schema.alterTable('forced_trade_offers', (table) => {
    table.renameColumn('amount_collateral', 'collateral_amount')
    table.renameColumn('amount_synthetic', 'synthetic_amount')
    table.renameColumn('a_is_buying_synthetic', 'is_a_buying_synthetic')
  })
  await knex.schema.alterTable('positions', (table) => {
    table.renameColumn('public_key', 'stark_key')
  })
}

export async function down(knex: Knex) {
  await knex.schema.alterTable('forced_trade_offers', (table) => {
    table.renameColumn('collateral_amount', 'amount_collateral')
    table.renameColumn('synthetic_amount', 'amount_synthetic')
    table.renameColumn('is_a_buying_synthetic', 'a_is_buying_synthetic')
  })
  await knex.schema.alterTable('positions', (table) => {
    table.renameColumn('stark_key', 'public_key')
  })
}
