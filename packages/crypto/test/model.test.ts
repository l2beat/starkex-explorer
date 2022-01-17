import { expect } from 'chai'

import { PedersenHash } from '../src'

describe(PedersenHash.name, () => {
  it('supports 0x prefixed strings', () => {
    const value = '0x1234dead'
    const hash = PedersenHash(value)
    expect(hash).to.equal('1234dead'.padStart(64, '0'))
  })

  it('supports unprefixed strings', () => {
    const value = '1234dead'
    const hash = PedersenHash(value)
    expect(hash).to.equal('1234dead'.padStart(64, '0'))
  })

  it('converts values to lowercase', () => {
    const value = '0x1234DEAD'
    const hash = PedersenHash(value)
    expect(hash).to.equal('1234dead'.padStart(64, '0'))
  })

  it('throws for non hex strings', () => {
    expect(() => PedersenHash('foo')).to.throw(
      TypeError,
      'Value must be a hex string'
    )
  })

  it('throws for empty string', () => {
    expect(() => PedersenHash('')).to.throw(
      TypeError,
      'Value must be a hex string'
    )
  })

  it('throws for a string that is too long', () => {
    expect(() => PedersenHash('1'.repeat(65))).to.throw(
      TypeError,
      'Value too large'
    )
  })

  it('supports maximum value', () => {
    const hash = PedersenHash('0' + 'f'.repeat(63))
    expect(hash).to.equal('0' + 'f'.repeat(63))
  })

  describe(PedersenHash.fromNumber.name, () => {
    it('throws for floating points', () => {
      expect(() => PedersenHash.fromNumber(1.5)).to.throw(
        TypeError,
        'Value cannot be floating point'
      )
    })

    it('throws for too large numbers', () => {
      expect(() =>
        PedersenHash.fromNumber(2 * Number.MAX_SAFE_INTEGER)
      ).to.throw(TypeError, 'Value too large')
    })

    it('throws for negative numbers', () => {
      expect(() => PedersenHash.fromNumber(-2)).to.throw(
        TypeError,
        'Value cannot be negative'
      )
    })

    it('throws for negative bigints', () => {
      expect(() => PedersenHash.fromNumber(-2n)).to.throw(
        TypeError,
        'Value cannot be negative'
      )
    })

    it('throws for too large bigints', () => {
      expect(() =>
        PedersenHash.fromNumber(BigInt('0x1' + '0'.repeat(63)))
      ).to.throw(TypeError, 'Value too large')
    })

    it('converts zero', () => {
      expect(PedersenHash.fromNumber(0)).to.equal(PedersenHash.ZERO)
      expect(PedersenHash.fromNumber(0n)).to.equal(PedersenHash.ZERO)
    })

    it('converts 0x1a2b3c', () => {
      const hash = PedersenHash('1a2b3c')

      expect(PedersenHash.fromNumber(0x1a2b3c)).to.equal(hash)
      expect(PedersenHash.fromNumber(0x1a2b3cn)).to.equal(hash)
    })

    it('converts maximum value', () => {
      const hash = PedersenHash('f'.repeat(63))

      expect(PedersenHash.fromNumber(BigInt('0x' + 'f'.repeat(63)))).to.equal(
        hash
      )
    })
  })
})
