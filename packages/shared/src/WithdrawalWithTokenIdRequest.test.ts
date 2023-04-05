//TODO: Add tests for WithdrawalWithTokenId

import { AssetHash, StarkKey } from '@explorer/types'
import { expect } from 'earl'

import {
  decodeWithdrawalWithTokenId,
  encodeWithdrawalWithTokenId,
} from './WithdrawalWithTokenIdRequest'

const starkKey = StarkKey(
  '0x070A6100ED8EF5DD2D61E6D00DE188E1EF2AC191F6178D99781150A04E889FD3'
)
const encodedData =
  '0x64d84842070a6100ed8ef5dd2d61e6d00de188e1ef2ac191f6178d99781150a04e889fd30f5becfffb42eac9db17002f559f25c8c25617304f85f92794ad481031346783000000000000000000000000000000000000000000000000000000000000007b'
const assetTypeHash = AssetHash(
  '0x0f5becfffb42eac9db17002f559f25c8c25617304f85f92794ad481031346783'
)

describe(encodeWithdrawalWithTokenId.name, () => {
  it('encodes an example tx', () => {
    expect(
      encodeWithdrawalWithTokenId({ starkKey, assetTypeHash, tokenId: 123n })
    ).toEqual(encodedData)
  })
})
describe(decodeWithdrawalWithTokenId.name, () => {
  it('encodes an example tx', () => {
    expect(decodeWithdrawalWithTokenId(encodedData)).toEqual({
      starkKey,
      assetTypeHash,
      tokenId: 123n,
    })
  })
})
