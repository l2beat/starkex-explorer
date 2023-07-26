import { CollateralAsset, ERC20Details } from '@explorer/shared'
import { AssetId, EthereumAddress } from '@explorer/types'

export function getCollateralAssetDetails(collateralAsset: CollateralAsset) {
  return ERC20Details.parse({
    assetHash: collateralAsset.assetHash,
    assetTypeHash: collateralAsset.assetHash,
    type: 'ERC20',
    quantum: AssetId.decimals(collateralAsset.assetId).toString(),
    contractError: [],
    address: EthereumAddress.ZERO,
    name: AssetId.symbol(collateralAsset.assetId),
    symbol: AssetId.symbol(collateralAsset.assetId),
    decimals: 2,
  })
}
