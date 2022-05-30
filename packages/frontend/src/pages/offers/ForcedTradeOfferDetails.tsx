import { AssetId, EthereumAddress } from '@explorer/types'
import React from 'react'

import { Page } from '../common'
import { ForcedHistory } from '../common/ForcedHistory'
import { ForcedPageHeader } from '../common/ForcedPageHeader'
import { PageHeaderStats } from '../common/PageHeaderStats'
import { SimpleLink } from '../common/SimpleLink'
import { formatCurrency } from '../formatting'
import { ForcedTradeOfferDetailsProps } from './ForcedTradeOfferDetailsProps'

export function toStatsRows(
  offer: Omit<ForcedTradeOfferDetailsProps['offer'], 'id' | 'addressA'> & {
    addressA?: EthereumAddress
  }
) {
  const partyA = offer.type === 'buy' ? 'Buyer' : 'Seller'
  const partyB = offer.type === 'buy' ? 'Seller' : 'Buyer'

  const rows = [
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
      content: offer.addressA?.toString() || '-',
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
    rows.push({
      title: `${partyB} position id`,
      content: (
        <SimpleLink href={`/positions/${offer.positionIdB}`}>
          #{offer.positionIdB.toString()}
        </SimpleLink>
      ),
    })
  }

  if (offer.addressB) {
    rows.push({
      title: `${partyB} ethereum address`,
      content: offer.addressB.toString(),
    })
  }

  return rows
}

export function ForcedTradeOfferDetails({
  account,
  offer,
  history,
}: ForcedTradeOfferDetailsProps) {
  const shouldRenderAccept = account !== offer.addressA && !offer.addressB
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
      <ForcedPageHeader displayId={offer.id} type={offer.type}>
        {shouldRenderAccept && (
          <button className="bg-blue-100 text-white float-right px-4 py-2 text-base rounded-md">
            Accept {`& ${offer.type === 'buy' ? 'sell' : 'buy'}`}
          </button>
        )}
      </ForcedPageHeader>
      <div className="mb-1.5 font-medium text-lg text-left">Stats</div>
      <PageHeaderStats rows={toStatsRows(offer)} />
      <ForcedHistory events={history} />
    </Page>
  )
}
