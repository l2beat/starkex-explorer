import { AssetId } from '@explorer/types'

import { encodeAssetId } from '../encoding/encodeAssetId'
import { DecodingError } from './DecodingError'

interface BigNumerLike {
  toHexString(): string
}

export function decodeAssetId(
  value: string | BigNumerLike,
  collateralAssetId?: AssetId
): AssetId {
  if (typeof value !== 'string') {
    return decodeAssetId(value.toHexString().slice(2), collateralAssetId)
  }

  if (collateralAssetId && value === encodeAssetId(collateralAssetId)) {
    return collateralAssetId
  }

  if (value.length !== 30) {
    throw new DecodingError('Invalid AssetId length')
  }
  const idString =
    value
      .match(/..?/g)
      ?.map((x) => String.fromCharCode(parseInt(x, 16)))
      .join('') ?? ''
  const zeroBytes = idString.match(/\0*$/)?.[0]?.length ?? 0
  return AssetId(idString.substring(0, idString.length - zeroBytes))
}
