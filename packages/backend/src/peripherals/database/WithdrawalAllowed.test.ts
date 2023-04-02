import { AssetHash, EthereumAddress, StarkKey } from '@explorer/types'
import { expect } from 'earl'

import {
  MintWithdrawData,
  WithdrawData,
  WithdrawWithTokenIdData,
} from './transactions/UserTransaction'
import {
  AssetWithdrawalAllowedData,
  decodeWithdrawableBalanceChangeData,
  encodeWithdrawableBalanceChangeData,
  MintableWithdrawalAllowedData,
  SpotWithdrawalAllowedData,
} from './WithdrawalAllowed'

describe(encodeWithdrawableBalanceChangeData.name, () => {
  it('can encode a WithdrawalAllowed', () => {
    const data: SpotWithdrawalAllowedData = {
      type: 'WithdrawalAllowed',
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
        type: 'WithdrawalAllowed',
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

  it('can encode a MintableWithdrawalAllowed', () => {
    const data: MintableWithdrawalAllowedData = {
      type: 'MintableWithdrawalAllowed',
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
        type: 'MintableWithdrawalAllowed',
        starkKey: data.starkKey.toString(),
        assetId: data.assetId,
        quantizedAmount: data.quantizedAmount.toString(),
      },
    })
    expect(JSON.parse(JSON.stringify(encoded.data))).toEqual(encoded.data)

    const decoded = decodeWithdrawableBalanceChangeData(encoded.data)
    expect(decoded).toEqual(data)
  })

  it('can encode a AssetWithdrawalAllowed', () => {
    const data: AssetWithdrawalAllowedData = {
      type: 'AssetWithdrawalAllowed',
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
        type: 'AssetWithdrawalAllowed',
        starkKey: data.starkKey.toString(),
        assetId: data.assetId,
        quantizedAmount: data.quantizedAmount.toString(),
      },
    })
    expect(JSON.parse(JSON.stringify(encoded.data))).toEqual(encoded.data)

    const decoded = decodeWithdrawableBalanceChangeData(encoded.data)
    expect(decoded).toEqual(data)
  })

  it('can encode a Withdraw', () => {
    const data: WithdrawData = {
      type: 'Withdraw',
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
        type: 'Withdraw',
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

  it('can encode a WithdrawWithTokenId', () => {
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
    const encoded = encodeWithdrawableBalanceChangeData(data)

    expect(encoded).toEqual({
      starkKey: data.starkKey,
      assetHash: data.assetId,
      balanceDelta: -data.quantizedAmount,
      data: {
        type: 'WithdrawWithTokenId',
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

  it('can encode a MintWithdrawal', () => {
    const data: MintWithdrawData = {
      type: 'MintWithdraw',
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
        type: 'MintWithdraw',
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
