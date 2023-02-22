import { AssetHash, EthereumAddress, StarkKey } from '@explorer/types'
import { expect } from 'earljs'

import {
  AssetWithdrawalAllowedData,
  decodeWithdrawableBalanceChangeData,
  encodeWithdrawableBalanceChangeData,
  MintableWithdrawalAllowedData,
  MintWithdrawalPerformedData,
  WithdrawalAllowedData,
  WithdrawalPerformedData,
  WithdrawalWithTokenIdPerformedData,
} from './WithdrawableBalanceChange'

describe(encodeWithdrawableBalanceChangeData.name, () => {
  it('can encode a LogWithdrawalAllowed', () => {
    const data: WithdrawalAllowedData = {
      event: 'LogWithdrawalAllowed',
      starkKey: StarkKey.fake(),
      assetType: AssetHash.fake(),
      nonQuantizedAmount: 123000n,
      quantizedAmount: 123n,
    }
    const encoded = encodeWithdrawableBalanceChangeData(data)

    expect(encoded).toEqual({
      starkKey: data.starkKey,
      assetHash: data.assetType,
      balanceDelta: data.quantizedAmount,
      data: {
        event: 'LogWithdrawalAllowed',
        starkKey: data.starkKey.toString(),
        assetType: data.assetType,
        nonQuantizedAmount: data.nonQuantizedAmount.toString(),
        quantizedAmount: data.quantizedAmount.toString(),
      },
    })
    expect(JSON.parse(JSON.stringify(encoded.data))).toEqual(encoded.data)

    const decoded = decodeWithdrawableBalanceChangeData(encoded.data)
    expect(decoded).toEqual(data)
  })

  it('can encode a LogMintableWithdrawalAllowed', () => {
    const data: MintableWithdrawalAllowedData = {
      event: 'LogMintableWithdrawalAllowed',
      starkKey: StarkKey.fake(),
      assetId: AssetHash.fake(),
      quantizedAmount: 123n,
    }
    const encoded = encodeWithdrawableBalanceChangeData(data)

    expect(encoded).toEqual({
      starkKey: data.starkKey,
      assetHash: data.assetId,
      balanceDelta: data.quantizedAmount,
      data: {
        event: 'LogMintableWithdrawalAllowed',
        starkKey: data.starkKey.toString(),
        assetId: data.assetId,
        quantizedAmount: data.quantizedAmount.toString(),
      },
    })
    expect(JSON.parse(JSON.stringify(encoded.data))).toEqual(encoded.data)

    const decoded = decodeWithdrawableBalanceChangeData(encoded.data)
    expect(decoded).toEqual(data)
  })

  it('can encode a LogAssetWithdrawalAllowed', () => {
    const data: AssetWithdrawalAllowedData = {
      event: 'LogAssetWithdrawalAllowed',
      starkKey: StarkKey.fake(),
      assetId: AssetHash.fake(),
      quantizedAmount: 123n,
    }
    const encoded = encodeWithdrawableBalanceChangeData(data)

    expect(encoded).toEqual({
      starkKey: data.starkKey,
      assetHash: data.assetId,
      balanceDelta: data.quantizedAmount,
      data: {
        event: 'LogAssetWithdrawalAllowed',
        starkKey: data.starkKey.toString(),
        assetId: data.assetId,
        quantizedAmount: data.quantizedAmount.toString(),
      },
    })
    expect(JSON.parse(JSON.stringify(encoded.data))).toEqual(encoded.data)

    const decoded = decodeWithdrawableBalanceChangeData(encoded.data)
    expect(decoded).toEqual(data)
  })

  it('can encode a LogWithdrawalPerformed', () => {
    const data: WithdrawalPerformedData = {
      event: 'LogWithdrawalPerformed',
      starkKey: StarkKey.fake(),
      assetType: AssetHash.fake(),
      nonQuantizedAmount: 123000n,
      quantizedAmount: 123n,
      recipient: EthereumAddress.fake('abc'),
    }
    const encoded = encodeWithdrawableBalanceChangeData(data)

    expect(encoded).toEqual({
      starkKey: data.starkKey,
      assetHash: data.assetType,
      balanceDelta: -data.quantizedAmount,
      data: {
        event: 'LogWithdrawalPerformed',
        starkKey: data.starkKey.toString(),
        assetType: data.assetType,
        nonQuantizedAmount: data.nonQuantizedAmount.toString(),
        quantizedAmount: data.quantizedAmount.toString(),
        recipient: data.recipient.toString(),
      },
    })
    expect(JSON.parse(JSON.stringify(encoded.data))).toEqual(encoded.data)

    const decoded = decodeWithdrawableBalanceChangeData(encoded.data)
    expect(decoded).toEqual(data)
  })

  it('can encode a LogWithdrawalWithTokenIdPerformed', () => {
    const data: WithdrawalWithTokenIdPerformedData = {
      event: 'LogWithdrawalWithTokenIdPerformed',
      starkKey: StarkKey.fake(),
      assetType: AssetHash.fake(),
      tokenId: 45n,
      assetId: AssetHash.fake(),
      nonQuantizedAmount: 123000n,
      quantizedAmount: 123n,
      recipient: EthereumAddress.fake('abc'),
    }
    const encoded = encodeWithdrawableBalanceChangeData(data)

    expect(encoded).toEqual({
      starkKey: data.starkKey,
      assetHash: data.assetId,
      balanceDelta: -data.quantizedAmount,
      data: {
        event: 'LogWithdrawalWithTokenIdPerformed',
        starkKey: data.starkKey.toString(),
        assetType: data.assetType,
        tokenId: data.tokenId.toString(),
        assetId: data.assetId,
        nonQuantizedAmount: data.nonQuantizedAmount.toString(),
        quantizedAmount: data.quantizedAmount.toString(),
        recipient: data.recipient.toString(),
      },
    })
    expect(JSON.parse(JSON.stringify(encoded.data))).toEqual(encoded.data)

    const decoded = decodeWithdrawableBalanceChangeData(encoded.data)
    expect(decoded).toEqual(data)
  })

  it('can encode a LogMintWithdrawalPerformed', () => {
    const data: MintWithdrawalPerformedData = {
      event: 'LogMintWithdrawalPerformed',
      starkKey: StarkKey.fake(),
      assetType: AssetHash.fake(),
      assetId: AssetHash.fake(),
      nonQuantizedAmount: 123000n,
      quantizedAmount: 123n,
    }
    const encoded = encodeWithdrawableBalanceChangeData(data)

    expect(encoded).toEqual({
      starkKey: data.starkKey,
      assetHash: data.assetId,
      balanceDelta: -data.quantizedAmount,
      data: {
        event: 'LogMintWithdrawalPerformed',
        starkKey: data.starkKey.toString(),
        assetType: data.assetType,
        assetId: data.assetId,
        nonQuantizedAmount: data.nonQuantizedAmount.toString(),
        quantizedAmount: data.quantizedAmount.toString(),
      },
    })
    expect(JSON.parse(JSON.stringify(encoded.data))).toEqual(encoded.data)

    const decoded = decodeWithdrawableBalanceChangeData(encoded.data)
    expect(decoded).toEqual(data)
  })
})
