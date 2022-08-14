export interface AssetId extends String {
  _AssetIdBrand: string
}

export function AssetId(value: string) {
  if (value.length > 15 || !/^\w+-\d+$/.test(value)) {
    throw new TypeError('Invalid AssetId')
  }
  return value as unknown as AssetId
}

AssetId.decimals = function decimals(assetId: AssetId) {
  return parseInt(assetId.split('-')[1] ?? '')
}

AssetId.symbol = function symbol(assetId: AssetId) {
  return assetId.replace(/-\d+$/, '')
}

AssetId.USDC = AssetId('USDC-6')
