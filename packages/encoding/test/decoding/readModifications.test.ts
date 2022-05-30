import { StarkKey } from '@explorer/types'
import { expect } from 'earljs'

import { DecodingError } from '../../src'
import { readModifications } from '../../src/decoding/readModifications'
import { ByteWriter } from '../../src/encoding/ByteWriter'
import { readToDecode } from './readToDecode'

describe(readModifications.name, () => {
  const decode = readToDecode(readModifications)

  it('fails for empty data', () => {
    expect(() => decode('')).toThrow(DecodingError, 'Went out of bounds')
  })

  it('can read zero modifications', () => {
    const writer = new ByteWriter().writeNumber(0, 32)
    expect(decode(writer.getBytes())).toEqual([])
  })

  it('can read a single modification', () => {
    const writer = new ByteWriter()
      .writeNumber(1, 32)
      .write(StarkKey.fake('1234abcd').toString())
      .writeNumber(123, 32)
      .writeNumber(32n + 2n ** 64n, 32)
    expect(decode(writer.getBytes())).toEqual([
      {
        publicKey: StarkKey.fake('1234abcd'),
        positionId: 123n,
        difference: 32n,
      },
    ])
  })

  it('can read multiple modifications', () => {
    const writer = new ByteWriter()
      .writeNumber(2, 32)
      .write(StarkKey.fake('1234abcd').toString())
      .writeNumber(123, 32)
      .writeNumber(32n + 2n ** 64n, 32)
      .write(StarkKey.fake('deadbeef').toString())
      .writeNumber(456, 32)
      .writeNumber(-32n + 2n ** 64n, 32)

    expect(decode(writer.getBytes())).toEqual([
      {
        publicKey: StarkKey.fake('1234abcd'),
        positionId: 123n,
        difference: 32n,
      },
      {
        publicKey: StarkKey.fake('deadbeef'),
        positionId: 456n,
        difference: -32n,
      },
    ])
  })
})
