import { AssetId } from '@explorer/types'

import { DYDX_INTERNAL_USDC_ID_ENCODED } from '../constants'
import { DecodingError } from './DecodingError'

export function decodeAssetId(value: string) {
  if (value === DYDX_INTERNAL_USDC_ID_ENCODED) {
    return AssetId.USDC
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
