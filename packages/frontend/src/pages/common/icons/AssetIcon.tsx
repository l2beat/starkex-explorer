import React from 'react'
import { AssetId } from '@explorer/types'

type AssetIconProps = {
  assetId: AssetId
} & React.ClassAttributes<HTMLImageElement> &
  React.ImgHTMLAttributes<HTMLImageElement>

const usdcLogoUrl = 'https://cryptologos.cc/logos/usd-coin-usdc-logo.svg'
const buildDydxUrl = (symbol: string) => `https://dydx.exchange/currencies/${symbol.toLowerCase()}.svg`
const buildUrl = (assetId: AssetId) => {
  const symbol = AssetId.symbol(assetId)
  if (symbol === 'USDC') {
    return usdcLogoUrl
  }
  return buildDydxUrl(symbol)
}

export function AssetIcon({ assetId, ...rest }: AssetIconProps) {
  const src = buildUrl(assetId)
  return <img src={src} {...rest} />
}
