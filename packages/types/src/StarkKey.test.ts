import { expect } from 'earl'
import { BigNumber } from 'ethers'

import { StarkKey } from './StarkKey'

describe(StarkKey.name, () => {
  it('accepts a valid key', () => {
    const hash = StarkKey(
      '0x0abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd123'
    )
    expect(hash.toString()).toEqual(
      '0x0abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd123'
    )
  })

  it('prepends 0x', () => {
    const hash = StarkKey(
      '0abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd123'
    )
    expect(hash.toString()).toEqual(
      '0x0abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd123'
    )
  })

  it('transforms to lowercase', () => {
    const hash = StarkKey(
      '0x0ABCD1234ABCD1234ABCD1234ABCD1234ABCD1234ABCD1234ABCD1234ABCD123'
    )
    expect(hash.toString()).toEqual(
      '0x0abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd123'
    )
  })

  it('throws for non-hex strings', () => {
    expect(() => StarkKey('foo')).toThrow(TypeError)
  })

  it('throws for short hex strings', () => {
    expect(() => StarkKey('0x123abc')).toThrow(TypeError)
  })

  it('throws for long hex strings', () => {
    expect(() => StarkKey('0x' + '1'.repeat(65))).toThrow(TypeError)
  })

  it('throws for hex string starting with non-zero', () => {
    expect(() =>
      StarkKey(
        'abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234'
      )
    ).toThrow(TypeError)
  })

  describe(StarkKey.from.name, () => {
    it('returns a padded hexadecimal representation of bigint', () => {
      expect(StarkKey.from(0x1234n)).toEqual(
        StarkKey(
          '0x0000000000000000000000000000000000000000000000000000000000001234'
        )
      )
    })

    it('returns a padded hexadecimal representation of BigNumber', () => {
      expect(StarkKey.from(BigNumber.from(0x1234))).toEqual(
        StarkKey(
          '0x0000000000000000000000000000000000000000000000000000000000001234'
        )
      )
    })
  })

  it('ZERO is the zero key', () => {
    expect(StarkKey.ZERO).toEqual(
      ('0x' + '0'.repeat(64)) as unknown as StarkKey
    )
  })
})
