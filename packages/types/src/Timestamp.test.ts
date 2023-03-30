import { expect } from 'earljs'

import { Timestamp } from './Timestamp'

describe(Timestamp.name, () => {
  it('throws if not an integer', () => {
    expect(() => Timestamp(3.14)).toThrow(
      RangeError,
      'The number 3.14 cannot be converted to a BigInt because it is not an integer'
    )
  })

  it('can be created from bigint', () => {
    expect(Timestamp(10_000_000_000n).valueOf()).toEqual(10_000_000_000n)
  })

  it('can be created from integer', () => {
    expect(Timestamp(10_000_000_000).valueOf()).toEqual(10_000_000_000n)
  })

  describe(Timestamp.fromSeconds.name, () => {
    it('can be created from bigint', () => {
      expect(Timestamp.fromSeconds(10_000_000n).valueOf()).toEqual(
        10_000_000_000n
      )
    })

    it('can be created from integer', () => {
      expect(Timestamp.fromSeconds(10_000_000).valueOf()).toEqual(
        10_000_000_000n
      )
    })
  })

  describe(Timestamp.fromHours.name, () => {
    it('can be created from bigint', () => {
      expect(Timestamp.fromHours(1n).valueOf()).toEqual(3600_000n)
    })
    it('can be created from integer', () => {
      expect(Timestamp.fromHours(1).valueOf()).toEqual(3600_000n)
    })
  })

  describe(Timestamp.toHours.name, () => {
    it('converts timestamp to hours bigint', () => {
      expect(Timestamp.toHours(Timestamp(7_200_000n))).toEqual(2n)
    })
  })

  describe(Timestamp.toSeconds.name, () => {
    it('converts timestamp to seconds bigint', () => {
      expect(Timestamp.toSeconds(Timestamp(7_200_000n))).toEqual(7200n)
    })
  })
})
