import { AssetDetails } from '@explorer/shared'
import { AssetHash, Hash256 } from '@explorer/types'

export class AssetDetailsMap {
  private readonly map = new Map<string, AssetDetails>()

  constructor(assetDetails: AssetDetails[]) {
    this.initializeAssetDetailsMap(assetDetails)
  }

  getByAssetHash(assetHash: AssetHash): AssetDetails | undefined {
    return this.map.get(assetHash.toString())
  }

  getByAssetTypeHashAndTokenId(
    assetTypeHash: Hash256,
    tokenId: bigint
  ): AssetDetails | undefined {
    return this.map.get(this.getAssetTypeWithTokenIdKey(assetTypeHash, tokenId))
  }

  private initializeAssetDetailsMap(assetDetails: AssetDetails[]) {
    assetDetails.forEach((assetDetail) => {
      if (assetDetail.type === 'ERC721' || assetDetail.type === 'ERC1155') {
        const { assetTypeHash, tokenId } = assetDetail
        this.map.set(
          this.getAssetTypeWithTokenIdKey(assetTypeHash, tokenId),
          assetDetail
        )
        return
      }
      this.map.set(assetDetail.assetHash.toString(), assetDetail)
    })
  }

  private getAssetTypeWithTokenIdKey(assetTypeHash: Hash256, tokenId: bigint) {
    return `${assetTypeHash.toString()}:${tokenId.toString()}`
  }
}
