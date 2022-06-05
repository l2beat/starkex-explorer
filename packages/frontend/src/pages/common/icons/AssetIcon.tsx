import { AssetId } from '@explorer/types'
import React from 'react'

import { getAssetImageUrl } from './getAssetImageUrl'

export interface AssetIconProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  assetId: AssetId
}

export function AssetIcon({ assetId, ...rest }: AssetIconProps) {
  const src = getAssetImageUrl(assetId)
  return <img src={src} {...rest} />
}
