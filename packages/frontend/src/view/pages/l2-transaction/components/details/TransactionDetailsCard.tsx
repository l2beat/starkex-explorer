import React from 'react'

import { RawIcon } from '../../../../assets/icons/RawIcon'
import { Card } from '../../../../components/Card'
import { Link } from '../../../../components/Link'

interface L2TransactionDetailsCardProps {
  children: React.ReactNode
  transactionId: number
}

export function L2TransactionDetailsCard({
  children,
  transactionId,
}: L2TransactionDetailsCardProps) {
  return (
    <Card className="relative flex flex-col gap-6">
      <Link
        className="absolute top-6 right-6 items-center !gap-1 text-md font-semibold"
        href={`/raw-l2-transactions/${transactionId}`}
        accessoryLeft={<RawIcon />}
      >
        Raw data
      </Link>
      {children}
    </Card>
  )
}
