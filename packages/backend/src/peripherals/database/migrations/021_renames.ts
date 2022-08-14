/*
                      ====== IMPORTANT NOTICE ======

DO NOT EDIT OR RENAME THIS FILE

This is a migration file. Once created the file should not be renamed or edited,
because migrations are only run once on the production server. 

If you find that something was incorrectly set up in the `up` function you
should create a new migration file that fixes the issue.

*/

import { Knex } from 'knex'

const tableRenames: [string, string][] = [
  ['state_transition_facts', 'state_transitions'],
  ['fact_to_pages', 'page_mappings'],
]

const columnRenames: [string, string, string][] = [
  ['page_mappings', 'fact_hash', 'state_transition_hash'],
]

const constraintRenames: [string, string, string][] = [
  [
    'state_transitions',
    'state_transition_facts_pkey',
    'state_transitions_pkey',
  ],
  ['page_mappings', 'fact_to_pages_pkey', 'page_mappings_pkey'],
]

const indexRenames: [string, string][] = [
  [
    'state_transition_facts_block_number_index',
    'state_transitions_block_number_index',
  ],
  ['state_transition_facts_hash_index', 'state_transitions_hash_index'],
  ['fact_to_pages_block_number_index', 'page_mappings_block_number_index'],
  ['fact_to_pages_page_hash_index', 'page_mappings_page_hash_index'],
]

export async function up(knex: Knex) {
  for (const [from, to] of tableRenames) {
    await renameTable(knex, from, to)
  }
  for (const [table, from, to] of columnRenames) {
    await renameColumn(knex, table, from, to)
  }
  for (const [table, from, to] of constraintRenames) {
    await renameConstraint(knex, table, from, to)
  }
  for (const [from, to] of indexRenames) {
    await renameIndex(knex, from, to)
  }
}

export async function down(knex: Knex) {
  for (const [to, from] of indexRenames) {
    await renameIndex(knex, from, to)
  }
  for (const [table, to, from] of constraintRenames) {
    await renameConstraint(knex, table, from, to)
  }
  for (const [table, to, from] of columnRenames) {
    await renameColumn(knex, table, from, to)
  }
  for (const [to, from] of tableRenames) {
    await renameTable(knex, from, to)
  }
}

async function renameIndex(knex: Knex, from: string, to: string) {
  await knex.raw('ALTER INDEX ?? RENAME TO ??;', [from, to])
}

async function renameTable(knex: Knex, from: string, to: string) {
  await knex.schema.renameTable(from, to)
}

async function renameColumn(
  knex: Knex,
  table: string,
  from: string,
  to: string
) {
  await knex.schema.alterTable(table, (t) => {
    t.renameColumn(from, to)
  })
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
