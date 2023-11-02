import {
  assertUnreachable,
  CollateralAsset,
  PageContext,
} from '@explorer/shared'
import { Timestamp } from '@explorer/types'
import classNames from 'classnames'
import { default as React, ReactNode } from 'react'

import { Asset, assetToInfo } from '../../../utils/assets'
import { formatAmount } from '../../../utils/formatting/formatAmount'
import { ArrowRightIcon } from '../../assets/icons/ArrowIcon'
import { AssetWithLogo } from '../AssetWithLogo'
import { Link } from '../Link'
import { StatusBadge, StatusType } from '../StatusBadge'
import { Table } from '../table/Table'
import { Column } from '../table/types'
import { TimeAgeCell } from '../TimeAgeCell'

interface OffersTableProps {
  context: PageContext<'perpetual'>
  offers: OfferEntry[]
  isHomePage?: boolean
  showRole?: boolean
  showInfoColumn?: boolean
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
    { header: 'Id', className: classNames(props.isHomePage && 'w-[130px]') },
    { header: 'Type' },
    ...(props.showInfoColumn
      ? [
          {
            header: 'Info',
            align: 'center' as const,
            className: classNames(props.isHomePage && 'w-max'),
          },
        ]
      : []),
    ...(props.showRole ? [{ header: 'Role' }] : []),
    {
      header: 'Status',
      className: classNames(props.isHomePage && 'w-[140px]'),
    },
    { header: 'Age', className: classNames(props.isHomePage && 'w-[90px]') },
  ]
  if (props.showInfoColumn) {
    props.offers
  }
  return (
    <Table
      columns={columns}
      rows={props.offers.map((offer) => {
        const cells: ReactNode[] = [
          <Link>#{offer.id}</Link>,
          <span className="capitalize">{offer.type.toLowerCase()}</span>,
          ...(props.showInfoColumn
            ? [
                <InfoColumn
                  offer={offer}
                  collateralAsset={props.context.collateralAsset}
                />,
              ]
            : []),
          ...(props.showRole
            ? [<span className="capitalize">{offer.role?.toLowerCase()}</span>]
            : []),
          <StatusBadge type={toStatusType(offer.status)}>
            {toStatusText(offer.status)}
          </StatusBadge>,
          <TimeAgeCell timestamp={offer.timestamp} />,
        ]

        return {
          link: `/offers/${offer.id}`,
          cells,
        }
      })}
    />
  )
}

interface Props {
  offer: OfferEntry
  collateralAsset: CollateralAsset
}

function InfoColumn({ offer, collateralAsset }: Props) {
  const trade =
    offer.type === 'SELL'
      ? {
          offeredAmount: offer.syntheticAmount,
          offeredAsset: offer.syntheticAsset,
          receivedAmount: offer.collateralAmount,
          receivedAsset: {
            hashOrId: collateralAsset.assetId,
          },
        }
      : {
          offeredAmount: offer.collateralAmount,
          offeredAsset: {
            hashOrId: collateralAsset.assetId,
          },
          receivedAmount: offer.syntheticAmount,
          receivedAsset: offer.syntheticAsset,
        }

  return (
    <div className="flex flex-1 items-center">
      <div className="flex items-center gap-2">
        {formatAmount(trade.offeredAsset, trade.offeredAmount)}
        <AssetWithLogo
          type="small"
          assetInfo={assetToInfo(trade.offeredAsset)}
        />
      </div>
      <ArrowRightIcon className="mx-1 flex-shrink-0" />
      <div className="flex items-center gap-2">
        {formatAmount(trade.receivedAsset, trade.receivedAmount)}
        <AssetWithLogo
          type="small"
          assetInfo={assetToInfo(trade.receivedAsset)}
        />
      </div>
    </div>
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
