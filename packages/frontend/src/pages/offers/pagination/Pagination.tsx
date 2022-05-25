import { AssetId } from '@explorer/types'
import React from 'react'

import { ServerPagination } from '../../common/pagination'
import { OfferType } from '../ForcedTradeOffersIndexProps'
import { AssetSelect } from './AssetSelect'
import { TypeRadio } from './TypeRadio'

interface PaginationProps {
  page: number
  perPage: number
  total: number
  assetId?: AssetId
  type?: OfferType
  assetIds?: AssetId[]
}

export function Pagination({
  page,
  perPage,
  assetId,
  assetIds,
  type,
  total,
}: PaginationProps) {
  const params = new URLSearchParams()
  if (type) {
    params.append('type', type)
  }
  if (assetId) {
    params.append('assetId', assetId.toString())
  }
  const query = params.toString()
  const baseUrl = `/forced/offers${query && `?${query}`}`

  return (
    <div className="relative pt-9">
      <ServerPagination
        page={page}
        perPage={perPage}
        total={total}
        baseUrl={baseUrl}
      >
        <div className="absolute left-0 right-0 flex justify-between top-0">
          <AssetSelect assetId={assetId} assetIds={assetIds} />
          <TypeRadio type={type} />
        </div>
      </ServerPagination>
    </div>
  )
}
