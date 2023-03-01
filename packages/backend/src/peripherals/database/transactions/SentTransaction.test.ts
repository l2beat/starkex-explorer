import { AssetHash, AssetId, StarkKey, Timestamp } from '@explorer/types'
import { expect } from 'earljs'

import {
  decodeSentTransactionData,
  encodeSentTransactionData,
  ForcedTradeData,
  ForcedWithdrawalData,
  WithdrawData,
} from './SentTransaction'

describe(encodeSentTransactionData.name, () => {
  it('can encode a ForcedWithdrawal', () => {
    const data: ForcedWithdrawalData = {
      type: 'ForcedWithdrawal',
      positionId: 1234n,
      quantizedAmount: 5000n,
      starkKey: StarkKey.fake(),
      premiumCost: false,
    }
    const encoded = encodeSentTransactionData(data)

    expect(encoded).toEqual({
      starkKey: data.starkKey,
      vaultOrPositionId: data.positionId,
      data: expect.anything(),
    })
    expect(JSON.parse(JSON.stringify(encoded.data))).toEqual(encoded.data)

    const decoded = decodeSentTransactionData(encoded.data)
    expect(decoded).toEqual(data)
  })

  it('can encode a ForcedTrade', () => {
    const data: ForcedTradeData = {
      type: 'ForcedTrade',
      starkKeyA: StarkKey.fake(),
      starkKeyB: StarkKey.fake(),
      positionIdA: 1234n,
      positionIdB: 5678n,
      collateralAmount: 10000n,
      collateralAssetId: AssetId.USDC,
      syntheticAmount: 20000n,
      syntheticAssetId: AssetId('ETH-9'),
      isABuyingSynthetic: true,
      nonce: 123456789n,
      submissionExpirationTime: Timestamp.now(),
      signatureB: '0x1234',
      offerId: 420,
      premiumCost: false,
    }
    const encoded = encodeSentTransactionData(data)

    expect(encoded).toEqual({
      starkKey: data.starkKeyA,
      vaultOrPositionId: data.positionIdA,
      data: expect.anything(),
    })
    expect(JSON.parse(JSON.stringify(encoded.data))).toEqual(encoded.data)

    const decoded = decodeSentTransactionData(encoded.data)
    expect(decoded).toEqual(data)
  })

  it('can encode a Withdraw', () => {
    const data: WithdrawData = {
      type: 'Withdraw',
      starkKey: StarkKey.fake(),
      assetType: AssetHash.fake('1234'),
    }
    const encoded = encodeSentTransactionData(data)

    expect(encoded).toEqual({
      starkKey: data.starkKey,
      vaultOrPositionId: undefined,
      data: expect.anything(),
    })
    expect(JSON.parse(JSON.stringify(encoded.data))).toEqual(encoded.data)

    const decoded = decodeSentTransactionData(encoded.data)
    expect(decoded).toEqual(data)
  })
})
