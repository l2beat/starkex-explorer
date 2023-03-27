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
  return await knex('forced_trade_offers')
    .whereNotNull('submission_expiration_time')
    .update(
      'submission_expiration_time',
      knex.raw('submission_expiration_time * 60 * 60 * 1000')
    )
}

export async function down(knex: Knex) {
  return await knex('forced_trade_offers')
    .whereNotNull('submission_expiration_time')
    .update(
      'submission_expiration_time',
      knex.raw('submission_expiration_time / 60 / 60 / 1000')
    )
}
