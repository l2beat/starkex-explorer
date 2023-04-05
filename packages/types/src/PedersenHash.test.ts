import { expect } from 'earl'

import { PedersenHash } from './PedersenHash'

describe(PedersenHash.name, () => {
  it('supports 0x prefixed strings', () => {
    const value = '0x1234dead'
    const hash = PedersenHash(value)
    expect(hash).toEqual(
      '1234dead'.padStart(64, '0') as unknown as PedersenHash
    )
  })

  it('supports unprefixed strings', () => {
    const value = '1234dead'
    const hash = PedersenHash(value)
    expect(hash).toEqual(
      '1234dead'.padStart(64, '0') as unknown as PedersenHash
    )
  })

  it('converts values to lowercase', () => {
    const value = '0x1234DEAD'
    const hash = PedersenHash(value)
    expect(hash).toEqual(
      '1234dead'.padStart(64, '0') as unknown as PedersenHash
    )
  })

  it('throws for non hex strings', () => {
    expect(() => PedersenHash('foo')).toThrow(
      TypeError,
      'Value must be a hex string'
    )
  })

  it('throws for empty string', () => {
    expect(() => PedersenHash('')).toThrow(
      TypeError,
      'Value must be a hex string'
    )
  })

  it('throws for a string that is too long', () => {
    expect(() => PedersenHash('1'.repeat(65))).toThrow(
      TypeError,
      'Value too large'
    )
  })

  it('supports maximum value', () => {
    const hash = PedersenHash('0' + 'f'.repeat(63))
    expect(hash).toEqual(('0' + 'f'.repeat(63)) as unknown as PedersenHash)
  })

  describe(PedersenHash.from.name, () => {
    it('throws for floating points', () => {
      expect(() => PedersenHash.from(1.5)).toThrow(
        TypeError,
        'Value cannot be floating point'
      )
    })

    it('throws for too large numbers', () => {
      expect(() => PedersenHash.from(2 * Number.MAX_SAFE_INTEGER)).toThrow(
        TypeError,
        'Value too large'
      )
    })

    it('throws for negative numbers', () => {
      expect(() => PedersenHash.from(-2)).toThrow(
        TypeError,
        'Value cannot be negative'
      )
    })

    it('throws for negative bigints', () => {
      expect(() => PedersenHash.from(-2n)).toThrow(
        TypeError,
        'Value cannot be negative'
      )
    })

    it('throws for too large bigints', () => {
      expect(() => PedersenHash.from(BigInt('0x1' + '0'.repeat(63)))).toThrow(
        TypeError,
        'Value too large'
      )
    })

    it('converts zero', () => {
      expect(PedersenHash.from(0)).toEqual(PedersenHash.ZERO)
      expect(PedersenHash.from(0n)).toEqual(PedersenHash.ZERO)
    })

    it('converts 0x1a2b3c', () => {
      const hash = PedersenHash('1a2b3c')

      expect(PedersenHash.from(0x1a2b3c)).toEqual(hash)
      expect(PedersenHash.from(0x1a2b3cn)).toEqual(hash)
    })

    it('converts maximum value', () => {
      const hash = PedersenHash('f'.repeat(63))

      expect(PedersenHash.from(BigInt('0x' + 'f'.repeat(63)))).toEqual(hash)
    })
  })
})
