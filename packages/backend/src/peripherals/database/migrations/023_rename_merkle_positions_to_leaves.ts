/*
                      ====== IMPORTANT NOTICE ======

DO NOT EDIT OR RENAME THIS FILE

This is a migration file. Once created the file should not be renamed or edited,
because migrations are only run once on the production server. 

If you find that something was incorrectly set up in the `up` function you
should create a new migration file that fixes the issue.

*/

import { Knex } from 'knex'

const tableRenames: [string, string][] = [['merkle_positions', 'merkle_leaves']]

const constraintRenames: [string, string, string][] = [
  ['merkle_leaves', 'merkle_positions_pkey', 'merkle_leaves_pkey'],
]

export async function up(knex: Knex) {
  for (const [from, to] of tableRenames) {
    await renameTable(knex, from, to)
  }
  for (const [table, from, to] of constraintRenames) {
    await renameConstraint(knex, table, from, to)
  }
}

export async function down(knex: Knex) {
  for (const [table, to, from] of constraintRenames) {
    await renameConstraint(knex, table, from, to)
  }
  for (const [to, from] of tableRenames) {
    await renameTable(knex, from, to)
  }
}

async function renameTable(knex: Knex, from: string, to: string) {
  await knex.schema.renameTable(from, to)
}

async function renameConstraint(
  knex: Knex,
  table: string,
  from: string,
  to: string
) {
  await knex.raw('ALTER TABLE ?? RENAME CONSTRAINT ?? TO ??;', [
    table,
    from,
    to,
  ])
}
