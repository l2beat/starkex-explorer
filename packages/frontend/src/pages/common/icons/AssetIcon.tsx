import { AssetId } from '@explorer/types'
import React from 'react'

type AssetIconProps = {
  assetId: AssetId
} & React.ClassAttributes<HTMLImageElement> &
  React.ImgHTMLAttributes<HTMLImageElement>

const usdcLogoUrl = '/images/usdc.svg'
const buildDydxUrl = (symbol: string) =>
  `https://dydx.exchange/currencies/${symbol.toLowerCase()}.svg`
const buildUrl = (assetId: AssetId) => {
  if (assetId === AssetId.USDC) {
    return usdcLogoUrl
  }
  return buildDydxUrl(AssetId.symbol(assetId))
}

export function AssetIcon({ assetId, ...rest }: AssetIconProps) {
  const src = buildUrl(assetId)
  return <img src={src} {...rest} />
}
