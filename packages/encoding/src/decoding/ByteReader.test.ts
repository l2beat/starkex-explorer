import { expect } from 'earljs'

import { ByteReader } from './ByteReader'
import { DecodingError } from './DecodingError'

describe('ByteReader', () => {
  describe('constructor', () => {
    it('does not accept non-hexadecimal string', () => {
      expect(() => new ByteReader('foo')).toThrow(
        TypeError,
        'Invalid hexadecimal string'
      )
    })

    it('does not accept odd length strings', () => {
      expect(() => new ByteReader('11223')).toThrow(
        TypeError,
        'Data is not byte aligned'
      )
    })

    it('can be constructed from a 0x prefixed string', () => {
      const reader = new ByteReader('0x112233')
      expect(reader.peek(3)).toEqual('112233')
    })

    it('can be constructed from an un-prefixed prefixed string', () => {
      const reader = new ByteReader('112233')
      expect(reader.peek(3)).toEqual('112233')
    })
  })

  describe('peek', () => {
    it('returns the next n bytes', () => {
      const reader = new ByteReader('112233')
      expect(reader.peek(2)).toEqual('1122')
    })

    it('always returns lowercase', () => {
      const reader = new ByteReader('aAbBcC')
      expect(reader.peek(3)).toEqual('aabbcc')
    })

    it('does not advance the position', () => {
      const reader = new ByteReader('112233')
      expect(reader.peek(3)).toEqual('112233')
      expect(reader.peek(2)).toEqual('1122')
      expect(reader.peek(1)).toEqual('11')
    })

    it('starts from the current position', () => {
      const reader = new ByteReader('112233')
      reader.skip(2)
      expect(reader.peek(1)).toEqual('33')
    })

    it('cannot go beyond the full length', () => {
      const reader = new ByteReader('112233')
      expect(() => reader.peek(4)).toThrow(DecodingError, 'Went out of bounds')
    })
  })

  describe('skip', () => {
    it('skips the next n bytes', () => {
      const reader = new ByteReader('112233')
      reader.skip(2)
      expect(reader.peek(1)).toEqual('33')
    })

    it('stacks', () => {
      const reader = new ByteReader('112233')
      reader.skip(1)
      reader.skip(1)
      expect(reader.peek(1)).toEqual('33')
    })

    it('cannot go beyond the full length', () => {
      const reader = new ByteReader('112233')
      expect(() => reader.skip(4)).toThrow(DecodingError, 'Went out of bounds')
    })
  })

  describe('read', () => {
    it('returns the next n bytes and advances the position', () => {
      const reader = new ByteReader('112233')
      expect(reader.read(2)).toEqual('1122')
      expect(reader.read(1)).toEqual('33')
    })

    it('cannot go beyond the full length', () => {
      const reader = new ByteReader('112233')
      expect(() => reader.read(4)).toThrow(DecodingError, 'Went out of bounds')
    })
  })

  describe('readBigInt', () => {
    it('reads the value and converts it to BigInt', () => {
      const reader = new ByteReader('1234567890abcdef')
      expect(reader.readBigInt(8)).toEqual(1311768467294899695n)
    })
  })

  describe('readNumber', () => {
    it('reads the value and converts it to number', () => {
      const reader = new ByteReader('1234')
      expect(reader.readNumber(2)).toEqual(4660)
    })

    it('checks that the number is small enough', () => {
      const reader = new ByteReader('1234567890abcdef')
      expect(() => reader.readNumber(8)).toThrow(
        DecodingError,
        'Number too large'
      )
    })
  })

  describe('isAtEnd', () => {
    it('returns false at the start', () => {
      const reader = new ByteReader('112233')
      expect(reader.isAtEnd()).toEqual(false)
    })

    it('returns false in the middle', () => {
      const reader = new ByteReader('112233')
      reader.skip(2)
      expect(reader.isAtEnd()).toEqual(false)
    })

    it('returns true at the end', () => {
      const reader = new ByteReader('112233')
      reader.skip(3)
      expect(reader.isAtEnd()).toEqual(true)
    })
  })

  describe('assertEnd', () => {
    it('throws when not at end', () => {
      const reader = new ByteReader('112233')
      reader.skip(2)
      expect(() => reader.assertEnd()).toThrow(
        DecodingError,
        'Unread data remaining'
      )
    })

    it('does nothing at the end', () => {
      const reader = new ByteReader('112233')
      reader.skip(3)
      reader.assertEnd()
    })
  })
})
