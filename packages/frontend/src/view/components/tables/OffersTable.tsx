import { assertUnreachable, PageContext } from '@explorer/shared'
import { Timestamp } from '@explorer/types'
import { default as React, ReactNode } from 'react'

import { Asset, assetToInfo } from '../../../utils/assets'
import { formatAmount } from '../../../utils/formatting/formatAmount'
import { AssetWithLogo } from '../AssetWithLogo'
import { Link } from '../Link'
import { StatusBadge, StatusType } from '../StatusBadge'
import { Table } from '../table/Table'
import { Column } from '../table/types'
import { TimeCell } from '../TimeCell'

export interface OffersTableProps {
  context: PageContext<'perpetual'>
  offers: OfferEntry[]
  showStatus?: boolean
  showRole?: boolean
}

export interface OfferEntry {
  timestamp: Timestamp
  id: string
  syntheticAsset: Asset
  syntheticAmount: bigint
  collateralAmount: bigint
  status:
    | 'CREATED'
    | 'ACCEPTED'
    | 'SENT'
    | 'CANCELLED'
    | 'EXPIRED'
    | 'MINED'
    | 'INCLUDED'
    | 'EXPIRED'
    | 'REVERTED'
  type: 'BUY' | 'SELL'
  role?: 'MAKER' | 'TAKER'
}

export function OffersTable(props: OffersTableProps) {
  const columns: Column[] = [
    { header: 'Time' },
    { header: 'Id' },
    { header: 'Asset' },
    { header: 'Amount', numeric: true },
    { header: 'Price', numeric: true },
    { header: 'Total price', numeric: true },
    ...(props.showStatus ? [{ header: 'Status' }] : []),
    ...(props.showRole ? [{ header: 'Role' }] : []),
    { header: 'Type' },
  ]
  if (props.context.tradingMode !== 'perpetual') {
    return null
  }
  const collateralAsset = props.context.collateralAsset
  return (
    <Table
      columns={columns}
      rows={props.offers.map((offer) => {
        const amount = formatAmount(offer.syntheticAsset, offer.syntheticAmount)
        const totalPrice = formatAmount(
          { hashOrId: collateralAsset.assetId },
          offer.collateralAmount
        )

        const cells: ReactNode[] = [
          <TimeCell timestamp={offer.timestamp} />,
          <Link>#{offer.id}</Link>,
          <AssetWithLogo
            type="small"
            assetInfo={assetToInfo(offer.syntheticAsset)}
          />,
          amount,
          0, //TODO: price
          totalPrice,
          ...(props.showStatus
            ? [
                <StatusBadge type={toStatusType(offer.status)}>
                  {toStatusText(offer.status)}
                </StatusBadge>,
              ]
            : []),
          ...(props.showRole
            ? [<span className="capitalize">{offer.role?.toLowerCase()}</span>]
            : []),
          <span className="capitalize">{offer.type.toLowerCase()}</span>,
        ]

        return {
          link: `/offers/${offer.id}`,
          cells,
        }
      })}
    />
  )
}

function toStatusType(status: OfferEntry['status']): StatusType {
  switch (status) {
    case 'CREATED':
      return 'BEGIN'
    case 'ACCEPTED':
    case 'SENT':
    case 'MINED':
      return 'MIDDLE'
    case 'INCLUDED':
      return 'END'
    case 'CANCELLED':
    case 'EXPIRED':
    case 'REVERTED':
      return 'CANCEL'
    default:
      assertUnreachable(status)
  }
}

function toStatusText(status: OfferEntry['status']): string {
  switch (status) {
    case 'CREATED':
      return 'CREATED (1/5)'
    case 'ACCEPTED':
      return 'ACCEPTED (2/5)'
    case 'SENT':
      return 'SENT (3/5)'
    case 'MINED':
      return 'MINED (4/5)'
    case 'INCLUDED':
      return 'INCLUDED (5/5)'
    case 'CANCELLED':
      return 'CANCELLED'
    case 'EXPIRED':
      return 'EXPIRED'
    case 'REVERTED':
      return 'REVERTED'
    default:
      assertUnreachable(status)
  }
}
