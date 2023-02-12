import { expect } from 'earljs'
import { BigNumber } from 'ethers'

import { AssetHash } from './AssetHash'

describe(AssetHash.name, () => {
  it('accepts a valid hash', () => {
    const hash = AssetHash(
      '0xabcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234'
    )
    expect(hash.toString()).toEqual(
      '0xabcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234'
    )
  })

  it('prepends 0x', () => {
    const hash = AssetHash(
      'abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234'
    )
    expect(hash.toString()).toEqual(
      '0xabcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234'
    )
  })

  it('transforms to lowercase', () => {
    const hash = AssetHash(
      '0xABCD1234ABCD1234ABCD1234ABCD1234ABCD1234ABCD1234ABCD1234ABCD1234'
    )
    expect(hash.toString()).toEqual(
      '0xabcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234'
    )
  })

  it('throws for non-hex strings', () => {
    expect(() => AssetHash('foo')).toThrow(TypeError)
  })

  it('fixes short non-prefixed strings', () => {
    expect(AssetHash('123abc').toString()).toEqual('0x0000000000000000000000000000000000000000000000000000000000123abc')
  })
  
  it('fixes short prefixed strings', () => {
    expect(AssetHash('0x123abc').toString()).toEqual('0x0000000000000000000000000000000000000000000000000000000000123abc')
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
})
