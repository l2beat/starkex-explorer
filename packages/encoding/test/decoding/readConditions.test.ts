import { PedersenHash } from '@explorer/types'
import { expect } from 'earljs'

import { DecodingError } from '../../src'
import { readConditions } from '../../src/decoding/readConditions'
import { ByteWriter } from '../../src/encoding/ByteWriter'
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
    const hash = PedersenHash.fake()
    const writer = new ByteWriter().writeNumber(1, 32).write(hash.toString())
    expect(decode(writer.getBytes())).toEqual([hash])
  })

  it('can read multiple conditions', () => {
    const hash1 = PedersenHash.fake()
    const hash2 = PedersenHash.fake()
    const writer = new ByteWriter()
      .writeNumber(2, 32)
      .write(hash1.toString())
      .write(hash2.toString())

    expect(decode(writer.getBytes())).toEqual([hash1, hash2])
  })
})
