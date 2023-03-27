import { expect } from 'earljs'

import {
  fakeErc20Details,
  fakeErc721Details,
  fakeErc1155Details,
  fakeEthDetails,
} from '../test/fakes'
import { AssetDetailsMap } from './AssetDetailsMap'

describe(AssetDetailsMap.name, () => {
  const assetDetails = [
    fakeEthDetails,
    fakeErc20Details,
    fakeErc721Details,
    fakeErc1155Details,
  ]
  const assetDetailsMap = new AssetDetailsMap(assetDetails)

  it('should initialize the map correctly', () => {
    const result = assetDetailsMap.getInitialAssetDetailsMap(assetDetails)
    expect(Array.from(result.keys())).toEqual([
      '0x0000000000000000000000000000000000000000000000000000000000000001',
      '0x0000000000000000000000000000000000000000000000000000000000000002',
      '0x0000000000000000000000000000000000000000000000000000000000000003:1',
      '0x0000000000000000000000000000000000000000000000000000000000000003',
      '0x0000000000000000000000000000000000000000000000000000000000000004:1',
      '0x0000000000000000000000000000000000000000000000000000000000000004',
    ])
    expect(Array.from(result.values())).toEqual([
      fakeEthDetails,
      fakeErc20Details,
      fakeErc721Details,
      fakeErc721Details,
      fakeErc1155Details,
      fakeErc1155Details,
    ])
  })

  describe(AssetDetailsMap.prototype.getByAssetHash.name, () => {
    it('should return the correct asset details for given assetHash', () => {
      const assetDetail = assetDetailsMap.getByAssetHash(
        fakeErc20Details.assetHash
      )

      expect(assetDetail).toEqual(fakeErc20Details)
    })
  })

  describe(AssetDetailsMap.prototype.getByAssetTypeHashAndTokenId.name, () => {
    it('should return the correct asset details for given assetTypeHash and tokenId', () => {
      const assetDetail = assetDetailsMap.getByAssetTypeHashAndTokenId(
        fakeErc721Details.assetTypeHash,
        fakeErc721Details.tokenId
      )

      expect(assetDetail).toEqual(fakeErc721Details)
    })
  })
})
