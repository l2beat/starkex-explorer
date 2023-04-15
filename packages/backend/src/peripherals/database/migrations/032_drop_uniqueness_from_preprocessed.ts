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
  const uniqueIndexName =
    'preprocessed_asset_history_stark_key_asset_hash_or_id_unique'
  const indexExists = await pgCheckIfIndexExists(knex, uniqueIndexName)
  if (!indexExists) {
    // This migration was already run, so we can safely
    // return without doing anything. This is because the down()
    // migration is not possible to run - see the comment there.
    return
  }

  await knex.schema.table('preprocessed_asset_history', (table) => {
    table.dropIndex([], uniqueIndexName)

    table.index(['stark_key', 'asset_hash_or_id'], undefined, {
      predicate: knex.whereRaw('is_current = true'),
    })
  })
}

export async function down() {
  // Not possible to re-add unique index (duplicates in the table),
}

async function pgCheckIfIndexExists(
  knex: Knex,
  indexName: string
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const result = await knex.raw(
    "SELECT * FROM pg_indexes WHERE indexname = ? AND schemaname = 'public'",
    [indexName]
  )
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return result.rows.length > 0
}
