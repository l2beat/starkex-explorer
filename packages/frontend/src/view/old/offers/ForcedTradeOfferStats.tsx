import { AssetId, EthereumAddress } from '@explorer/types'
import React from 'react'

import { EtherscanLink } from '../common/EtherscanLink'
import { SimpleLink } from '../common/SimpleLink'
import { StatsTable } from '../common/table/StatsTable'
import { formatCurrency } from '../formatting'

export interface MinimalOffer {
  readonly positionIdA: bigint
  readonly addressA?: EthereumAddress
  readonly syntheticAmount: bigint
  readonly collateralAmount: bigint
  readonly syntheticAssetId: AssetId
  readonly positionIdB?: bigint
  readonly addressB?: EthereumAddress
}

export interface ForcedTradeOfferStatsProps {
  offer: MinimalOffer
}

export function ForcedTradeOfferStats({ offer }: ForcedTradeOfferStatsProps) {
  return <StatsTable rows={getForcedTradeOfferStatRows(offer)} />
}

export function getForcedTradeOfferStatRows(offer: MinimalOffer) {
  const rows = []

  rows.push({
    title: "Maker's position",
    content: (
      <SimpleLink href={`/positions/${offer.positionIdA}`}>
        {offer.positionIdA.toString()}
      </SimpleLink>
    ),
  })

  if (offer.addressA) {
    rows.push({
      title: "Maker's ethereum address",
      content: (
        <EtherscanLink address={offer.addressA}>{offer.addressA}</EtherscanLink>
      ),
    })
  }

  rows.push({
    title: 'Tokens transferred',
    content: formatCurrency(offer.syntheticAmount, offer.syntheticAssetId),
  })

  rows.push({
    title: 'Value received',
    content: formatCurrency(offer.collateralAmount, AssetId.USDC),
  })

  if (offer.positionIdB) {
    rows.push({
      title: "Taker's position",
      content: (
        <SimpleLink href={`/positions/${offer.positionIdB}`}>
          {offer.positionIdB.toString()}
        </SimpleLink>
      ),
    })
  }

  if (offer.addressB) {
    rows.push({
      title: "Taker's ethereum address",
      content: (
        <EtherscanLink address={offer.addressB}>{offer.addressB}</EtherscanLink>
      ),
    })
  }

  return rows
}
