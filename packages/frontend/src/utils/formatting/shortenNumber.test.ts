import { expect } from 'earl'
import { it } from 'mocha'

import { shortenNumber } from './shortenNumber'

describe(shortenNumber.name, () => {
  it('should shorten numbers', () => {
    expect(shortenNumber(0)).toEqual('0')
    expect(shortenNumber(1)).toEqual('1')
    expect(shortenNumber(10)).toEqual('10')
    expect(shortenNumber(100)).toEqual('100')
    expect(shortenNumber(1000)).toEqual('1K')
    expect(shortenNumber(10000)).toEqual('10K')
    expect(shortenNumber(100000)).toEqual('100K')
    expect(shortenNumber(1000000)).toEqual('1M')
    expect(shortenNumber(10000000)).toEqual('10M')
    expect(shortenNumber(100000000)).toEqual('100M')
  })
})
