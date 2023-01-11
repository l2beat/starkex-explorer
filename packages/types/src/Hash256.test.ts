import { expect } from 'earljs'
import { BigNumber } from 'ethers'

import { Hash256 } from './Hash256'

describe(Hash256.name, () => {
  it('accepts a valid hash', () => {
    const hash = Hash256(
      '0xabcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234'
    )
    expect(hash.toString()).toEqual(
      '0xabcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234'
    )
  })

  it('prepends 0x', () => {
    const hash = Hash256(
      'abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234'
    )
    expect(hash.toString()).toEqual(
      '0xabcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234'
    )
  })

  it('transforms to lowercase', () => {
    const hash = Hash256(
      '0xABCD1234ABCD1234ABCD1234ABCD1234ABCD1234ABCD1234ABCD1234ABCD1234'
    )
    expect(hash.toString()).toEqual(
      '0xabcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234'
    )
  })

  it('throws for non-hex strings', () => {
    expect(() => Hash256('foo')).toThrow(TypeError)
  })

  it('throws for short hex strings', () => {
    expect(() => Hash256('0x123abc')).toThrow(TypeError)
  })

  it('throws for long hex strings', () => {
    expect(() => Hash256('0x' + '1'.repeat(65))).toThrow(TypeError)
  })

  describe(Hash256.from.name, () => {
    it('returns a padded hexadecimal representation of bigint', () => {
      expect(Hash256.from(0x1234n)).toEqual(
        Hash256(
          '0x0000000000000000000000000000000000000000000000000000000000001234'
        )
      )
    })

    it('returns a padded hexadecimal representation of BigNumber', () => {
      expect(Hash256.from(BigNumber.from(0x1234))).toEqual(
        Hash256(
          '0x0000000000000000000000000000000000000000000000000000000000001234'
        )
      )
    })
  })
})
