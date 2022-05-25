import { AssetId } from '@explorer/types'
import React from 'react'

import { AssetIcon } from '../../common/icons/AssetIcon'

export function AssetSelect({
  assetId,
  assetIds = [],
}: {
  assetId?: AssetId
  assetIds?: AssetId[]
}) {
  return (
    <div className="flex bg-grey-300 gap-2 items-center rounded-md relative px-3 py-0">
      {assetId ? (
        <>
          <AssetIcon className="w-4 h-4" assetId={assetId} />
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
        name="assetId"
        className="absolute top-0 left-0 w-full h-full opacity-0 bg-white appearance-none cursor-pointer"
      >
        {assetIds.map((id) => (
          <option
            key={id.toString()}
            value={id.toString()}
            selected={id === assetId}
          >
            {AssetId.symbol(id)}
          </option>
        ))}
        <option key="all" value="all" selected={!assetId}>
          All assets
        </option>
      </select>
    </div>
  )
}
