import { expect } from 'chai'

import { ByteReader } from '../src/ByteReader'
import { DecodingError } from '../src/DecodingError'

describe('ByteReader', () => {
  describe('constructor', () => {
    it('does not accept non-hexadecimal string', () => {
      expect(() => new ByteReader('foo')).to.throw(
        TypeError,
        'Invalid hexadecimal string'
      )
    })

    it('does not accept odd length strings', () => {
      expect(() => new ByteReader('11223')).to.throw(
        TypeError,
        'Data is not byte aligned'
      )
    })

    it('can be constructed from a 0x prefixed string', () => {
      const reader = new ByteReader('0x112233')
      expect(reader.peek(3)).to.equal('112233')
    })

    it('can be constructed from an un-prefixed prefixed string', () => {
      const reader = new ByteReader('112233')
      expect(reader.peek(3)).to.equal('112233')
    })
  })

  describe('peek', () => {
    it('returns the next n bytes', () => {
      const reader = new ByteReader('112233')
      expect(reader.peek(2)).to.equal('1122')
    })

    it('always returns lowercase', () => {
      const reader = new ByteReader('aAbBcC')
      expect(reader.peek(3)).to.equal('aabbcc')
    })

    it('does not advance the position', () => {
      const reader = new ByteReader('112233')
      expect(reader.peek(3)).to.equal('112233')
      expect(reader.peek(2)).to.equal('1122')
      expect(reader.peek(1)).to.equal('11')
    })

    it('starts from the current position', () => {
      const reader = new ByteReader('112233')
      reader.skip(2)
      expect(reader.peek(1)).to.equal('33')
    })

    it('cannot go beyond the full length', () => {
      const reader = new ByteReader('112233')
      expect(() => reader.peek(4)).to.throw(DecodingError, 'Went out of bounds')
    })
  })

  describe('skip', () => {
    it('skips the next n bytes', () => {
      const reader = new ByteReader('112233')
      reader.skip(2)
      expect(reader.peek(1)).to.equal('33')
    })

    it('stacks', () => {
      const reader = new ByteReader('112233')
      reader.skip(1)
      reader.skip(1)
      expect(reader.peek(1)).to.equal('33')
    })

    it('cannot go beyond the full length', () => {
      const reader = new ByteReader('112233')
      expect(() => reader.skip(4)).to.throw(DecodingError, 'Went out of bounds')
    })
  })

  describe('read', () => {
    it('returns the next n bytes and advances the position', () => {
      const reader = new ByteReader('112233')
      expect(reader.read(2)).to.equal('1122')
      expect(reader.read(1)).to.equal('33')
    })

    it('cannot go beyond the full length', () => {
      const reader = new ByteReader('112233')
      expect(() => reader.read(4)).to.throw(DecodingError, 'Went out of bounds')
    })
  })
})
