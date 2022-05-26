import { expect } from 'earljs'

import { DecodingError } from '../../src'
import { readConditions } from '../../src/decoding/readConditions'
import { ByteWriter } from './ByteWriter'
import { readToDecode } from './readToDecode'

describe(readConditions.name, () => {
  const decode = readToDecode(readConditions)

  it('fails for empty data', () => {
    expect(() => decode('')).toThrow(DecodingError, 'Went out of bounds')
  })

  it('can read zero conditions', () => {
    const writer = new ByteWriter().writeNumber(0, 32)
    expect(decode(writer.getBytes())).toEqual([])
  })

  it('can read a single condition', () => {
    const writer = new ByteWriter()
      .writeNumber(1, 32)
      .write('1234abcd'.repeat(8))
    expect(decode(writer.getBytes())).toEqual(['0x' + '1234abcd'.repeat(8)])
  })

  it('can read multiple conditions', () => {
    const writer = new ByteWriter()
      .writeNumber(2, 32)
      .write('1234abcd'.repeat(8))
      .write('deadbeef'.repeat(8))

    expect(decode(writer.getBytes())).toEqual([
      '0x' + '1234abcd'.repeat(8),
      '0x' + 'deadbeef'.repeat(8),
    ])
  })
})
