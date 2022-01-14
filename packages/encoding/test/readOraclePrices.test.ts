import { expect } from 'earljs'

import { DecodingError } from '../src'
import { encodeAssetId } from '../src/encodeAssetId'
import { readOraclePrices } from '../src/readOraclePrices'
import { ByteWriter } from './ByteWriter'
import { readToDecode } from './readToDecode'

describe('readOraclePrices', () => {
  const decode = readToDecode(readOraclePrices)

  it('fails for empty data', () => {
    expect(() => decode('')).toThrow(DecodingError, 'Went out of bounds')
  })

  it('can read zero prices', () => {
    const writer = new ByteWriter().writeNumber(0, 32)
    expect(decode(writer.getBytes())).toEqual([])
  })

  it('can read a single price', () => {
    const writer = new ByteWriter()
      .writeNumber(1, 32)
      .writePadding(17)
      .write(encodeAssetId('ETH-9'))
      .writeNumber(1n, 32)
    expect(decode(writer.getBytes())).toEqual([{ assetId: 'ETH-9', price: 1n }])
  })

  it('can read a multiple prices', () => {
    const writer = new ByteWriter()
      .writeNumber(3, 32)
      .writePadding(17)
      .write(encodeAssetId('ETH-9'))
      .writeNumber(1n, 32)
      .writePadding(17)
      .write(encodeAssetId('BTC-10'))
      .writeNumber(50n, 32)
      .writePadding(17)
      .write(encodeAssetId('ABC-123'))
      .writeNumber(456n, 32)

    expect(decode(writer.getBytes())).toEqual([
      { assetId: 'ETH-9', price: 1n },
      { assetId: 'BTC-10', price: 50n },
      { assetId: 'ABC-123', price: 456n },
    ])
  })
})
