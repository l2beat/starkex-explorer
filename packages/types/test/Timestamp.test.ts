import { expect } from 'earljs'

import { Timestamp } from '../src'

describe(Timestamp.name, () => {
  it('throws if not an integer', () => {
    expect(() => Timestamp(3.14)).toThrow(TypeError, 'Value must be an integer')
  })

  it('can represent timestamp in seconds', () => {
    expect(+Timestamp(10_000_000_000)).toEqual(10_000_000_000_000)
  })

  it('can represent timestamp in milliseconds', () => {
    expect(+Timestamp(10_000_000_001)).toEqual(10_000_000_001)
  })
})
