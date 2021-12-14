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
  return idString.substring(0, idString.length - zeroBytes)
}

export function encodeAssetId(value: string) {
  if (value.length > 15) {
    throw new Error('AssetId too long')
  }
  const bytes = value.split('').map((x) => x.charCodeAt(0))
  if (bytes.some((x) => x > 255)) {
    throw new Error('AssetId contains invalid characters')
  }
  return bytes
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('')
    .padEnd(30, '0')
}
