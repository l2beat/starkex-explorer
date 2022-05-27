import { AssetId } from '@explorer/types'
import React from 'react'

import { HiddenInputs } from '../../common/HiddenInputs'
import { OfferType } from '../ForcedTradeOffersIndexProps'
import { AssetSelect } from './AssetSelect'
import { FormId } from './attributes'
import { TypeRadio } from './TypeRadio'

interface FilteringFormProps {
  assetId?: AssetId
  type?: OfferType
  assetIds?: AssetId[]
  baseUrl?: string
  additionalParams?: URLSearchParams
}

export function FilteringForm({
  assetId,
  assetIds,
  type,
  baseUrl = '/forced/offers',
  additionalParams,
}: FilteringFormProps) {
  return (
    <form
      action={baseUrl}
      method="get"
      id={FormId}
      className="flex justify-between mb-2"
    >
      <AssetSelect assetId={assetId} assetIds={assetIds} />
      <TypeRadio type={type} />
      {additionalParams && <HiddenInputs params={additionalParams} />}
    </form>
  )
}
