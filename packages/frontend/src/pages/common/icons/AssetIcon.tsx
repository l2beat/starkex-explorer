import { AssetId } from '@explorer/types'
import React from 'react'

import { getAssetImageUrl } from './getAssetImageUrl'

type AssetIconProps = {
  assetId: AssetId
} & React.ClassAttributes<HTMLImageElement> &
  React.ImgHTMLAttributes<HTMLImageElement>

export function AssetIcon({ assetId, ...rest }: AssetIconProps) {
  const src = getAssetImageUrl(assetId)
  return <img src={src} {...rest} />
}
