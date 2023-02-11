import cx from 'classnames'
import React from 'react'

import { Button } from '../Button'
import { NewTableRow } from './NewTableRow'
import { NoRowsMessage } from './NoRowsMessage'
import { Column, Row } from './types'

interface TableProps {
    title: string
    id?: string
    pageSize?: number
    columns: Column[]
    fullBackground?: boolean
    rows: Row[]
    className?: string
    noRowsText: string
}

export function NewTable(props: TableProps) {
    const pageSize = props.pageSize ?? props.rows.length
  return (
    <div className='mb-8 pb-7'>
        <div className='flex justify-between items-center pb-5'>
            <p className='text-white text-2xl font-semibold'>{props.title}</p>
            {props.pageSize && <p className='text-grey-500 font-medium text-sm'>{`You're viewing ${props.rows.length < props.pageSize ? props.rows.length: props.pageSize} out of ${props.rows.length} ${props.title.toLowerCase()}`}</p>}
        </div>
        <div className={cx('overflow-x-auto w-full pt-3  rounded-lg', {'bg-blue-900 px-6 pb-8': props.fullBackground}, props.className)}>
            <table id={props.id} cellPadding="0" cellSpacing="0" className="w-full whitespace-nowrap" style={{borderSpacing: 0}}>
                <thead className='bg-blue-900'>
                    <tr>
                        {props.columns.map((column, i) => (
                        <th
                            scope="col"
                            key={i}
                            className={cx(
                            'pb-0.5 first:pl-6 last:pr-6 font-medium p-0 first:rounded-l-action-button last:rounded-r-action-button border-0 border-none',
                            column.textAlignClass ??
                                (column.numeric ? 'text-right' : 'text-left'),
                            column.className
                            )}
                        >
                            <div className="py-0.5 text-xs text-grey-500">
                                {column.header}
                            </div>
                        </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {props.rows.length > 0 ? (
                        props.rows.map(({ cells, link }, i) => (
                        <NewTableRow
                            hidden={i >= pageSize}
                            cells={cells}
                            link={link}
                            columns={props.columns}
                            i={i}
                            key={i}
                            className={!props.fullBackground ? 'first:pl-6 last:pr-6': undefined}
                        />
                        ))
                    ) : (
                        <NoRowsMessage
                        text={props.noRowsText}
                        colSpan={props.columns.length}
                        />
                    )}
                </tbody>
            </table>
        </div>
        {props.rows.length > pageSize && <div className='pt-3 flex justify-center items-center'>
                        <Button variant="VIEW_ALL">View all {props.title.toLowerCase()}</Button>
        </div>}
    </div>
  )
}
