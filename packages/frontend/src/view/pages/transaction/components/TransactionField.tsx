import React, { ReactNode } from 'react'

interface TransactionFieldProps {
  label: string
  children: ReactNode
}

export function TransactionField(props: TransactionFieldProps) {
  return (
    <div className="flex-1">
      <p className="mb-2 text-sm text-zinc-500">{props.label}</p>
      <div className="text-lg font-semibold">{props.children}</div>
    </div>
  )
}
