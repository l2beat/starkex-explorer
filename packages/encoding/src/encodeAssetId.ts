import { AssetId } from '@explorer/types'

import { DYDX_INTERNAL_USDC_ID_ENDODED } from './constants'

export function encodeAssetId(assetId: AssetId) {
  if (assetId === AssetId.USDC) {
    return DYDX_INTERNAL_USDC_ID_ENDODED
  }

  return assetId
    .split('')
    .map((x) => x.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('')
    .padEnd(30, '0')
}
