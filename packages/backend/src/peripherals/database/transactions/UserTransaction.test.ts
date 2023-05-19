import { AssetHash, AssetId, EthereumAddress, StarkKey } from '@explorer/types'
import { expect } from 'earl'

import {
  decodeUserTransactionData,
  encodeUserTransactionData,
  ForcedTradeData,
  ForcedWithdrawalData,
  FullWithdrawalData,
  MintWithdrawData,
  WithdrawData,
  WithdrawWithTokenIdData,
} from './UserTransaction'

describe(encodeUserTransactionData.name, () => {
  it('can encode a ForcedWithdrawal', () => {
    const data: ForcedWithdrawalData = {
      type: 'ForcedWithdrawal',
      positionId: 1234n,
      quantizedAmount: 5000n,
      starkKey: StarkKey.fake(),
    }
    const encoded = encodeUserTransactionData(data)

    expect(encoded).toEqual({
      starkKeyA: data.starkKey,
      vaultOrPositionIdA: data.positionId,
      data: expect.anything(),
    })
    expect(JSON.parse(JSON.stringify(encoded.data))).toEqual(encoded.data)

    const decoded = decodeUserTransactionData(encoded.data)
    expect(decoded).toEqual(data)
  })

  it('can encode a FullWithdrawal', () => {
    const data: FullWithdrawalData = {
      type: 'FullWithdrawal',
      starkKey: StarkKey.fake(),
      vaultId: 1234n,
    }
    const encoded = encodeUserTransactionData(data)

    expect(encoded).toEqual({
      starkKeyA: data.starkKey,
      vaultOrPositionIdA: data.vaultId,
      data: {
        type: 'FullWithdrawal',
        starkKey: data.starkKey.toString(),
        vaultId: data.vaultId.toString(),
      },
    })
    expect(JSON.parse(JSON.stringify(encoded.data))).toEqual(encoded.data)

    const decoded = decodeUserTransactionData(encoded.data)
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
    }
    const encoded = encodeUserTransactionData(data)

    expect(encoded).toEqual({
      starkKeyA: data.starkKeyA,
      starkKeyB: data.starkKeyB,
      vaultOrPositionIdA: data.positionIdA,
      vaultOrPositionIdB: data.positionIdB,
      data: expect.anything(),
    })
    expect(JSON.parse(JSON.stringify(encoded.data))).toEqual(encoded.data)

    const decoded = decodeUserTransactionData(encoded.data)
    expect(decoded).toEqual(data)
  })

  it('can encode a Withdraw', () => {
    const data: WithdrawData = {
      type: 'Withdraw',
      starkKey: StarkKey.fake(),
      assetType: AssetHash('0x1234'),
      nonQuantizedAmount: 10000n,
      quantizedAmount: 5000n,
      recipient: EthereumAddress.fake(),
    }
    const encoded = encodeUserTransactionData(data)

    expect(encoded).toEqual({
      starkKeyA: data.starkKey,
      data: expect.anything(),
    })
    expect(JSON.parse(JSON.stringify(encoded.data))).toEqual(encoded.data)

    const decoded = decodeUserTransactionData(encoded.data)
    expect(decoded).toEqual(data)
  })

  it('can encode a WithdrawalWithTokenId', () => {
    const data: WithdrawWithTokenIdData = {
      type: 'WithdrawWithTokenId',
      starkKey: StarkKey.fake(),
      assetType: AssetHash.fake(),
      tokenId: 45n,
      assetId: AssetHash.fake(),
      nonQuantizedAmount: 123000n,
      quantizedAmount: 123n,
      recipient: EthereumAddress.fake('abc'),
    }
    const encoded = encodeUserTransactionData(data)

    expect(encoded).toEqual({
      starkKeyA: data.starkKey,
      data: {
        type: 'WithdrawWithTokenId',
        starkKey: data.starkKey.toString(),
        assetType: data.assetType.toString(),
        tokenId: data.tokenId.toString(),
        assetId: data.assetId.toString(),
        nonQuantizedAmount: data.nonQuantizedAmount.toString(),
        quantizedAmount: data.quantizedAmount.toString(),
        recipient: data.recipient.toString(),
      },
    })
    expect(JSON.parse(JSON.stringify(encoded.data))).toEqual(encoded.data)

    const decoded = decodeUserTransactionData(encoded.data)
    expect(decoded).toEqual(data)
  })
  it('can encode a MintWithdraw', () => {
    const data: MintWithdrawData = {
      type: 'MintWithdraw',
      starkKey: StarkKey.fake(),
      assetType: AssetHash.fake(),
      assetId: AssetHash.fake(),
      nonQuantizedAmount: 123000n,
      quantizedAmount: 123n,
    }
    const encoded = encodeUserTransactionData(data)

    expect(encoded).toEqual({
      starkKeyA: data.starkKey,
      data: {
        type: 'MintWithdraw',
        starkKey: data.starkKey.toString(),
        assetType: data.assetType.toString(),
        assetId: data.assetId.toString(),
        nonQuantizedAmount: data.nonQuantizedAmount.toString(),
        quantizedAmount: data.quantizedAmount.toString(),
      },
    })
    expect(JSON.parse(JSON.stringify(encoded.data))).toEqual(encoded.data)

    const decoded = decodeUserTransactionData(encoded.data)
    expect(decoded).toEqual(data)
  })
})
