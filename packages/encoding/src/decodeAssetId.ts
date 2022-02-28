import { AssetId } from '@explorer/types'

import { DecodingError } from './DecodingError'

export function decodeAssetId(value: string) {
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
