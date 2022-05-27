import { AssetId } from '@explorer/types'
import React from 'react'

import { Page } from '../common'
import { ForcedHistory } from '../common/ForcedHistory'
import { PageHeaderStats } from '../common/PageHeaderStats'
import { SimpleLink } from '../common/SimpleLink'
import { formatCurrency } from '../formatting'
import { ForcedTradeOfferDetailsProps } from './ForcedTradeOfferDetailsProps'

export function toStatsRows(
  offer: Omit<ForcedTradeOfferDetailsProps['offer'], 'id'>
) {
  const partyA = offer.type === 'buy' ? 'Buyer' : 'Seller'
  const partyB = offer.type === 'buy' ? 'Seller' : 'Buyer'

  const base = [
    {
      title: `${partyA} position id`,
      content: (
        <SimpleLink href={`/positions/${offer.positionIdA}`}>
          #{offer.positionIdA.toString()}
        </SimpleLink>
      ),
    },
    {
      title: `${partyA} ethereum address`,
      content: offer.addressA.toString(),
    },
    {
      title: 'Tokens sold',
      content: formatCurrency(offer.amountSynthetic, offer.assetId),
    },
    {
      title: 'Value received',
      content: formatCurrency(offer.amountCollateral, AssetId.USDC),
    },
  ]

  if (offer.positionIdB) {
    base.push({
      title: `${partyB} position id`,
      content: (
        <SimpleLink href={`/positions/${offer.positionIdB}`}>
          #{offer.positionIdB.toString()}
        </SimpleLink>
      ),
    })
  }

  if (offer.addressB) {
    base.push({
      title: `${partyB} ethereum address`,
      content: offer.addressB.toString(),
    })
  }

  return base
}

export function ForcedTradeOfferDetails({
  account,
  offer,
  history,
}: ForcedTradeOfferDetailsProps) {
  return (
    <Page
      title="L2BEAT dYdX Explorer"
      description="Site under construction"
      url="https://dydx.l2beat.com"
      image="/images/under-construction.png"
      stylesheets={['/styles/main.css']}
      scripts={['/scripts/main.js']}
      account={account}
    >
      <h1 className="font-sans font-bold text-2xl mb-12 overflow-x-hidden text-ellipsis whitespace-nowrap">
        Forced {offer.type} #{offer.id}
      </h1>
      <div className="mb-1.5 font-medium text-lg text-left">Stats</div>
      <PageHeaderStats rows={toStatsRows(offer)} />
      <ForcedHistory events={history} />
    </Page>
  )
}
