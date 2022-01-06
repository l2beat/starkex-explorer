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
