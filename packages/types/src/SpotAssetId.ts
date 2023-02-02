export interface SpotAssetId extends String {
  _SpotAssetIdBrand: string
}

export function SpotAssetId(value: string) {
  //TODO:  Think about validating SpotAssetIds
  if (value.length > 200) {
    throw new TypeError('Invalid SpotAssetId')
  }

  return value as unknown as SpotAssetId
}
