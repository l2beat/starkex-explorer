import cx from 'classnames'
import React, { ReactNode } from 'react'

interface TransactionFieldProps {
  label: string
  className?: string
  children: ReactNode
}

export function TransactionField(props: TransactionFieldProps) {
  return (
    <div className={cx(props.className ?? 'flex-1')}>
      <p className="mb-2 text-sm text-zinc-500">{props.label}</p>
      <div className="text-lg font-semibold">{props.children}</div>
    </div>
  )
}

export function TransactionYesOrNoField(
  props: Omit<TransactionFieldProps, 'children'> & { value: boolean }
) {
  return (
    <TransactionField {...props}>{props.value ? 'Yes' : 'No'}</TransactionField>
  )
}
