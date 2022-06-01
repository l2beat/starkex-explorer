import { toSignableCreateOffer } from '@explorer/shared'
import { AssetId, EthereumAddress, StarkKey } from '@explorer/types'
import { expect } from 'earljs'
import { Wallet } from 'ethers'

import {
  validateAcceptSignature,
  validateCreateSignature,
  validateSyntheticBalance,
} from '../../../../src/api/controllers/utils/ForcedTradeOfferValidators'
import { fakeBigInt } from '../../../fakes'
import { accepted, addressB, offer } from './ForcedTradeOfferMockData'

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
    const request = toSignableCreateOffer(offer)
    const signature = await wallet.signMessage(request)
    expect(validateCreateSignature(offer, signature, address)).toBeTruthy()
  })
})

describe(validateAcceptSignature.name, () => {
  it('accepts correct input', async () => {
    expect(validateAcceptSignature(offer, accepted, addressB)).toBeTruthy()
  })
})

describe(validateSyntheticBalance.name, () => {
  it('returns true for sufficient synthetic sell', () => {
    const amountSynthetic = 5n
    const assetId = AssetId('BTC-10')
    const balances = [
      {
        assetId,
        balance: amountSynthetic,
      },
    ]

    const valid = validateSyntheticBalance(amountSynthetic, assetId, balances)

    expect(valid).toBeTruthy()
  })

  it('returns false for insufficient synthetic sell', () => {
    const amountSynthetic = 5n
    const assetId = AssetId('BTC-10')
    const balances = [
      {
        assetId,
        balance: amountSynthetic - 1n,
      },
    ]

    const valid = validateSyntheticBalance(amountSynthetic, assetId, balances)

    expect(valid).toBeFalsy()
  })

  it('returns false if buying missing asset', () => {
    const amountSynthetic = 5n
    const assetId = AssetId('ETH-9')
    const balances = [
      {
        assetId,
        balance: amountSynthetic - 1n,
      },
    ]

    const valid = validateSyntheticBalance(
      amountSynthetic,
      AssetId('BTC-10'),
      balances
    )

    expect(valid).toBeFalsy()
  })
})
