import React from 'react'

import { Button } from '../../../../components/Button'
import { Card } from '../../../../components/Card'

interface TransactionDetailsCardProps {
  children: React.ReactNode
  transactionId: number
}

export function TransactionDetailsCard({
  children,
  transactionId,
}: TransactionDetailsCardProps) {
  return (
    <Card className="relative flex flex-col gap-6">
      <Button
        as="a"
        className="absolute top-4 right-4"
        href={`/raw-l2-transactions/${transactionId}`}
      >
        RAW
      </Button>
      {children}
    </Card>
  )
}
