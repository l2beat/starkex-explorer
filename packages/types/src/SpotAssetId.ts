export interface SpotAssetId extends String {
  _SpotAssetIdBrand: string
}

export function SpotAssetId(value: string) {
  if (value.length > 75) {
    throw new TypeError('Invalid SpotAssetId')
  }

  return value as unknown as SpotAssetId
}
