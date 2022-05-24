import { getCreateRequest } from '@explorer/shared'
import { AssetId, EthereumAddress, StarkKey } from '@explorer/types'
import { expect } from 'earljs'
import { Wallet } from 'ethers'

import {
  validateAcceptSignature,
  validateCreateSignature,
} from '../../../../src/api/controllers/utils/ForcedTradeOfferValidators'
import { fakeBigInt } from '../../../fakes'
import { accepted, addressB, offer } from './ForcedTradeOfferMockData'

// Mock data taken from real transaction: https://etherscan.io/tx/0x9b2dce5538d0c8c08511c9383be9b67da6f952b367baff0c8bdb5f66c9395634

describe(validateCreateSignature.name, () => {
  it('accepts correct input', async () => {
    const offer = {
      aIsBuyingSynthetic: true,
      amountCollateral: fakeBigInt(),
      amountSynthetic: fakeBigInt(),
      positionIdA: fakeBigInt(),
      starkKeyA: StarkKey.fake(),
      syntheticAssetId: AssetId('BTC-10'),
    }
    const wallet = Wallet.createRandom()
    const address = EthereumAddress(wallet.address)
    const request = getCreateRequest(offer)
    const signature = await wallet.signMessage(request)
    expect(validateCreateSignature(offer, signature, address)).toBeTruthy()
  })
})

describe(validateAcceptSignature.name, () => {
  it('accepts correct input', async () => {
    expect(validateAcceptSignature(offer, accepted, addressB)).toBeTruthy()
  })
})
