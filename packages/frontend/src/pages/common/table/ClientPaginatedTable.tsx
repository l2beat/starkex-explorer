import React from 'react'

import { ClientPagination } from '../pagination'
import { Table } from './Table'
import { ClientPaginatedTableProps } from './types'

export function ClientPaginatedTable(props: ClientPaginatedTableProps) {
  return (
    <>
      <ClientPagination total={props.rows.length} tableId={props.id} />
      <Table
        id={props.id}
        hasClientPagination
        columns={props.columns}
        rows={props.rows}
        className={props.className}
        noRowsText={props.noRowsText}
      />
    </>
  )
}
