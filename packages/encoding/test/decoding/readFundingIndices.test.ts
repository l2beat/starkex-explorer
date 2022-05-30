import { AssetId } from '@explorer/types'
import { expect } from 'earljs'

import { DecodingError } from '../../src'
import { MIN_INT } from '../../src/constants'
import { readFundingIndices } from '../../src/decoding/readFundingIndices'
import { ByteWriter } from '../../src/encoding/ByteWriter'
import { encodeAssetId } from '../../src/encoding/encodeAssetId'
import { readToDecode } from './readToDecode'

describe('readFundingIndices', () => {
  const decode = readToDecode(readFundingIndices)

  it('fails for empty data', () => {
    expect(() => decode('')).toThrow(DecodingError, 'Went out of bounds')
  })

  it('can read zero indices', () => {
    const writer = new ByteWriter().writeNumber(0, 32)
    expect(decode(writer.getBytes())).toEqual([])
  })

  it('can read a single index', () => {
    const writer = new ByteWriter()
      .writeNumber(1, 32)
      .writePadding(17)
      .write(encodeAssetId(AssetId('ETH-9')))
      .writeNumber(1n - MIN_INT, 32)
    expect(decode(writer.getBytes())).toEqual([
      { assetId: AssetId('ETH-9'), value: 1n },
    ])
  })

  it('can read a multiple indices', () => {
    const writer = new ByteWriter()
      .writeNumber(3, 32)
      .writePadding(17)
      .write(encodeAssetId(AssetId('ETH-9')))
      .writeNumber(1n - MIN_INT, 32)
      .writePadding(17)
      .write(encodeAssetId(AssetId('BTC-10')))
      .writeNumber(-50n - MIN_INT, 32)
      .writePadding(17)
      .write(encodeAssetId(AssetId('ABC-123')))
      .writeNumber(456n - MIN_INT, 32)

    expect(decode(writer.getBytes())).toEqual([
      { assetId: AssetId('ETH-9'), value: 1n },
      { assetId: AssetId('BTC-10'), value: -50n },
      { assetId: AssetId('ABC-123'), value: 456n },
    ])
  })
})
