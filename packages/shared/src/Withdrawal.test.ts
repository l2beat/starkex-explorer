import { StarkKey } from '@explorer/types'
import { expect } from 'earljs'

import { decodeWithdrawal, encodeWithdrawal } from './Withdrawal'

const starkKey = StarkKey(
  '0x070A6100ED8EF5DD2D61E6D00DE188E1EF2AC191F6178D99781150A04E889FD3'
)
const exampleData =
  '0x441a3e70070a6100ed8ef5dd2d61e6d00de188e1ef2ac191f6178d99781150a04e889fd300000000000000000000000000000000000000000000000000000000f47261b0'

describe(encodeWithdrawal.name, () => {
  it('encodes an example tx', () => {
    expect(encodeWithdrawal(starkKey, 'ERC20')).toEqual(
      '0x441a3e70070a6100ed8ef5dd2d61e6d00de188e1ef2ac191f6178d99781150a04e889fd300000000000000000000000000000000000000000000000000000000f47261b0'
    )
  })
})

describe(decodeWithdrawal.name, () => {
  it('encodes an example tx', () => {
    expect(decodeWithdrawal(exampleData)).toEqual({
      starkKey,
      assetType: '0xf47261b0',
    })
  })
})
