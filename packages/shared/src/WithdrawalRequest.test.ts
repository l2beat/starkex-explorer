import { AssetHash, StarkKey } from '@explorer/types'
import { expect } from 'earljs'

import { decodeWithdrawal, encodeWithdrawal } from './WithdrawalRequest'

const starkKey = StarkKey(
  '0x070A6100ED8EF5DD2D61E6D00DE188E1EF2AC191F6178D99781150A04E889FD3'
)
const exampleData =
  '0x441a3e70070a6100ed8ef5dd2d61e6d00de188e1ef2ac191f6178d99781150a04e889fd3a040c21f6b2b83cabea7749502bf2a6984d6e309e01195461590989b424c867f'
const assetTypeHash = AssetHash(
  '0xa040c21f6b2b83cabea7749502bf2a6984d6e309e01195461590989b424c867f'
)
describe(encodeWithdrawal.name, () => {
  it('encodes an example tx', () => {
    expect(encodeWithdrawal({ starkKey, assetTypeHash })).toEqual(exampleData)
  })
})

describe(decodeWithdrawal.name, () => {
  it('encodes an example tx', () => {
    expect(decodeWithdrawal(exampleData)).toEqual({
      starkKey,
      assetTypeHash,
    })
  })
})
