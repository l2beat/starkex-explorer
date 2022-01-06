import { expect } from 'chai'

import { DecodingError } from '../src'
import { MIN_INT } from '../src/constants'
import { encodeAssetId } from '../src/encodeAssetId'
import { readState } from '../src/readState'
import { ByteWriter } from './ByteWriter'
import { readToDecode } from './readToDecode'

describe('readState', () => {
  const decode = readToDecode(readState)

  it('fails for empty data', () => {
    expect(() => decode('')).to.throw(DecodingError, 'Went out of bounds')
  })

  it('decodes a simple state', () => {
    const writer = new ByteWriter()
      .writeNumber(8, 32)
      .write('deadbeef'.repeat(8))
      .writeNumber(10, 32)
      .write('abcd1234'.repeat(8))
      .writeNumber(12, 32)
      .writeNumber(0, 32)
      .writeNumber(1234, 32)
      .writeNumber(0, 32)
      .writeNumber(5678, 32)
    expect(decode(writer.getBytes())).to.deep.equal({
      positionRoot: '0x' + 'deadbeef'.repeat(8),
      positionHeight: 10,
      orderRoot: '0x' + 'abcd1234'.repeat(8),
      orderHeight: 12,
      indices: [],
      timestamp: 1234n,
      oraclePrices: [],
      systemTime: 5678n,
    })
  })

  it('decodes state with indices and prices', () => {
    const writer = new ByteWriter()
      .writeNumber(16, 32)
      .write('deadbeef'.repeat(8))
      .writeNumber(10, 32)
      .write('abcd1234'.repeat(8))
      .writeNumber(12, 32)
      .writeNumber(2, 32)
      .writePadding(17)
      .write(encodeAssetId('ETH-9'))
      .writeNumber(1n - MIN_INT, 32)
      .writePadding(17)
      .write(encodeAssetId('BTC-10'))
      .writeNumber(-50n - MIN_INT, 32)
      .writeNumber(1234, 32)
      .writeNumber(2, 32)
      .writePadding(17)
      .write(encodeAssetId('ETH-9'))
      .writeNumber(69n, 32)
      .writePadding(17)
      .write(encodeAssetId('BTC-10'))
      .writeNumber(420n, 32)
      .writeNumber(5678, 32)
    expect(decode(writer.getBytes())).to.deep.equal({
      positionRoot: '0x' + 'deadbeef'.repeat(8),
      positionHeight: 10,
      orderRoot: '0x' + 'abcd1234'.repeat(8),
      orderHeight: 12,
      indices: [
        {
          assetId: 'ETH-9',
          value: 1n,
        },
        {
          assetId: 'BTC-10',
          value: -50n,
        },
      ],
      timestamp: 1234n,
      oraclePrices: [
        {
          assetId: 'ETH-9',
          price: 69n,
        },
        {
          assetId: 'BTC-10',
          price: 420n,
        },
      ],
      systemTime: 5678n,
    })
  })
})
