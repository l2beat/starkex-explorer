import { expect } from 'earljs'
import { BigNumber } from 'ethers'

import { AssetHash } from './AssetHash'

describe(AssetHash.name, () => {
  it('accepts a valid hash', () => {
    const hash = AssetHash(
      '0x0bcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234'
    )
    expect(hash.toString()).toEqual(
      '0x0bcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234'
    )
  })

  it('prepends 0x', () => {
    const hash = AssetHash(
      'abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd123'
    )
    expect(hash.toString()).toEqual(
      '0x0abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd123'
    )
  })

  it('throws when most significant byte is not 0', () => {
    expect(() => AssetHash('0x1' + '0'.repeat(63))).toThrow(TypeError)
  })

  it('transforms to lowercase', () => {
    const hash = AssetHash(
      '0x0ABCD1234ABCD1234ABCD1234ABCD1234ABCD1234ABCD1234ABCD1234ABCD123'
    )
    expect(hash.toString()).toEqual(
      '0x0abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd123'
    )
  })

  it('throws for non-hex strings', () => {
    expect(() => AssetHash('foo')).toThrow(TypeError)
  })

  it('fixes short non-prefixed strings', () => {
    expect(AssetHash('123abc').toString()).toEqual(
      '0x0000000000000000000000000000000000000000000000000000000000123abc'
    )
  })

  it('fixes short prefixed strings', () => {
    expect(AssetHash('0x123abc').toString()).toEqual(
      '0x0000000000000000000000000000000000000000000000000000000000123abc'
    )
  })

  it('throws for long hex strings', () => {
    expect(() => AssetHash('0x' + '1'.repeat(65))).toThrow(TypeError)
  })

  describe(AssetHash.from.name, () => {
    it('returns a padded hexadecimal representation of bigint', () => {
      expect(AssetHash.from(0x1234n)).toEqual(
        AssetHash(
          '0x0000000000000000000000000000000000000000000000000000000000001234'
        )
      )
    })

    it('returns a padded hexadecimal representation of BigNumber', () => {
      expect(AssetHash.from(BigNumber.from(0x1234))).toEqual(
        AssetHash(
          '0x0000000000000000000000000000000000000000000000000000000000001234'
        )
      )
    })
  })

  describe(AssetHash.check.name, () => {
    it('returns true for valid AssetHash strings', () => {
      const validHash =
        '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
      expect(AssetHash.check(validHash)).toEqual(true)
    })

    it('returns false for strings that are not valid AssetHash', () => {
      const invalidHash =
        '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef12'
      expect(AssetHash.check(invalidHash)).toEqual(false)
    })

    it('returns false for non-string values', () => {
      expect(AssetHash.check(12345)).toEqual(false)
      expect(AssetHash.check(null)).toEqual(false)
      expect(AssetHash.check(undefined)).toEqual(false)
      expect(AssetHash.check({})).toEqual(false)
      expect(AssetHash.check([])).toEqual(false)
    })
  })
})
