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
  await knex.schema.table('preprocessed_asset_history', (table) => {
    table.dropIndex(
      [],
      'preprocessed_asset_history_stark_key_asset_hash_or_id_unique'
    )

    table.index(['stark_key', 'asset_hash_or_id'], undefined, {
      predicate: knex.whereRaw('is_current = true'),
    })
  })
}

export async function down(knex: Knex) {
  await knex.schema.table('preprocessed_asset_history', (table) => {
    table.dropIndex(
      [],
      'preprocessed_asset_history_stark_key_asset_hash_or_id_index'
    )

    table.unique(['stark_key', 'asset_hash_or_id'], {
      predicate: knex.whereRaw('is_current = true'),
    })
  })
}
