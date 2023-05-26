export interface AssetId extends String {
  _AssetIdBrand: string
}

export function AssetId(value: string) {
  // TODO: temporarily allowing no dash for TESTTOKEN1 in GammaX testnet
  if (value.length > 15 || !/^\w+-?\d+$/.test(value)) {
    throw new TypeError('Invalid AssetId')
  }
  return value as unknown as AssetId
}

AssetId.check = function check(value: unknown): value is AssetId {
  if (typeof value !== 'string') {
    return false
  }
  try {
    AssetId(value)
    return true
  } catch {
    return false
  }
}

AssetId.decimals = function decimals(assetId: AssetId) {
  // TODO: temporarily returning 0 when no dash in name (TESTTOKEN1)
  return parseInt(assetId.split('-')[1] ?? '0')
}

AssetId.symbol = function symbol(assetId: AssetId) {
  return assetId.replace(/-\d+$/, '')
}
