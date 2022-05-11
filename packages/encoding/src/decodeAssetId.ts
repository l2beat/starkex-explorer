import { AssetId } from '@explorer/types'

import { DYDX_INTERNAL_USDC_ID_ENDODED } from './constants'
import { DecodingError } from './DecodingError'

export function decodeAssetId(value: string) {
  if (value === DYDX_INTERNAL_USDC_ID_ENDODED) {
    return AssetId.USDC
  }

  if (value.length !== 30) {
    throw new DecodingError('Invalid AssetId length')
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const idString = value
    .match(/..?/g)!
    .map((x) => String.fromCharCode(parseInt(x, 16)))
    .join('')
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const zeroBytes = idString.match(/\0*$/)![0].length
  return AssetId(idString.substring(0, idString.length - zeroBytes))
}
