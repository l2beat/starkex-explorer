import { expect } from 'earljs'

import { packBytes } from '../src/packBytes'

describe(packBytes.name, () => {
  it('correctly packs scenario 1', () => {
    const packed = packBytes([
      { bytes: 8, value: 9223372036854775810n },
      { bytes: 2, value: 1 },
    ])
    expect(packed).toEqual('80000000000000020001')
  })

  it('correctly packs scenario 2', () => {
    const packed = packBytes([
      { bytes: 16, value: '4554482d3900000000000000000000' },
      { bytes: 8, value: 9223372036854775807n },
      { bytes: 8, value: 9223372036854775863n },
    ])
    expect(packed).toEqual('004554482d39000000000000000000007fffffffffffffff8000000000000037')
  })
})
