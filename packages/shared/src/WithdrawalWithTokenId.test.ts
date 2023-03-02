//TODO: Add tests for WithdrawalWithTokenId

import { StarkKey } from '@explorer/types'
import { expect } from 'earljs'

import {
  decodeWithdrawalWithTokenId,
  encodeWithdrawalWithTokenId,
} from './WithdrawalWithTokenId'

const starkKey = StarkKey(
  '0x070A6100ED8EF5DD2D61E6D00DE188E1EF2AC191F6178D99781150A04E889FD3'
)
const encodedData =
  '0x64d84842070a6100ed8ef5dd2d61e6d00de188e1ef2ac191f6178d99781150a04e889fd30000000000000000000000000000000000000000000000000000000002571792000000000000000000000000000000000000000000000000000000000000007b'

describe(encodeWithdrawalWithTokenId.name, () => {
  it('encodes an example tx', () => {
    expect(encodeWithdrawalWithTokenId(starkKey, 'ERC721', 123n)).toEqual(
      encodedData
    )
  })
})
describe(decodeWithdrawalWithTokenId.name, () => {
  it('encodes an example tx', () => {
    expect(decodeWithdrawalWithTokenId(encodedData)).toEqual({
      starkKey,
      assetType: '0x02571792',
      tokenId: 123n,
    })
  })
})
