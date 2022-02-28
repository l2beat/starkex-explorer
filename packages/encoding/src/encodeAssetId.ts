import { AssetId } from '@explorer/types'

export function encodeAssetId(assetId: AssetId) {
  return assetId
    .split('')
    .map((x) => x.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('')
    .padEnd(30, '0')
}
