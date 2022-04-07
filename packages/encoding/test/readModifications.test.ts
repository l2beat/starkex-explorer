import { expect } from 'earljs'

import { DecodingError } from '../src'
import { readModifications } from '../src/readModifications'
import { ByteWriter } from './ByteWriter'
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
      .write('1234abcd'.repeat(8))
      .writeNumber(123, 32)
      .writeNumber(32n + 2n ** 64n, 32)
    expect(decode(writer.getBytes())).toEqual([
      {
        publicKey: '0x' + '1234abcd'.repeat(8),
        positionId: 123n,
        difference: 32n,
      },
    ])
  })

  it('can read multiple modifications', () => {
    const writer = new ByteWriter()
      .writeNumber(2, 32)
      .write('1234abcd'.repeat(8))
      .writeNumber(123, 32)
      .writeNumber(32n + 2n ** 64n, 32)
      .write('deadbeef'.repeat(8))
      .writeNumber(456, 32)
      .writeNumber(-32n + 2n ** 64n, 32)

    expect(decode(writer.getBytes())).toEqual([
      {
        publicKey: '0x' + '1234abcd'.repeat(8),
        positionId: 123n,
        difference: 32n,
      },
      {
        publicKey: '0x' + 'deadbeef'.repeat(8),
        positionId: 456n,
        difference: -32n,
      },
    ])
  })
})
