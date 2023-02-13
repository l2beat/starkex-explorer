import { AssetId } from '@explorer/types'
import React from 'react'

import { AssetIcon } from '../../common/icons/AssetIcon'
import { AssetIdSelectName, DisabledOptionValue } from './attributes'

interface AssetSelectProps {
  assetId?: AssetId
  assetIds?: AssetId[]
}

export function AssetSelect({ assetId, assetIds = [] }: AssetSelectProps) {
  return (
    <div className="relative flex items-center gap-2 rounded-md bg-grey-300 px-3 py-0">
      {assetId ? (
        <>
          <AssetIcon className="h-4 w-4" assetId={assetId} />
          <span>{AssetId.symbol(assetId)}</span>
        </>
      ) : (
        'All assets'
      )}
      <svg viewBox="0 0 10 5" width="10" height="5" className="fill-white">
        <path d="M0 0L10 0L5 5D" />
      </svg>
      <select
        id="assetId"
        name={AssetIdSelectName}
        className="absolute top-0 left-0 h-full w-full cursor-pointer appearance-none bg-white opacity-0"
        defaultValue={assetId?.toString() ?? DisabledOptionValue}
      >
        {assetIds.map((id) => (
          <option key={id.toString()} value={id.toString()}>
            {AssetId.symbol(id)}
          </option>
        ))}
        <option key="all" value={DisabledOptionValue}>
          All assets
        </option>
      </select>
    </div>
  )
}
