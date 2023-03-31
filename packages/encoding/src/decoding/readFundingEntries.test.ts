import { AssetId, Timestamp } from '@explorer/types'
import { expect } from 'earljs'

import { MIN_INT } from '../constants'
import { ByteWriter } from '../encoding/ByteWriter'
import { encodeAssetId } from '../encoding/encodeAssetId'
import { readToDecode } from '../test/readToDecode'
import { DecodingError } from './DecodingError'
import { readFundingEntries } from './readFundingEntries'

describe('readFundingEntries', () => {
  const decode = readToDecode((reader) => readFundingEntries(reader))

  it('fails for empty data', () => {
    expect(() => decode('')).toThrow(DecodingError, 'Went out of bounds')
  })

  it('can read zero entries', () => {
    const writer = new ByteWriter().writeNumber(0, 32)
    expect(decode(writer.getBytes())).toEqual([])
  })

  it('can read an entry without indices', () => {
    const writer = new ByteWriter()
      .writeNumber(1, 32)
      .writeNumber(0, 32)
      .writeNumber(1234, 32)
    expect(decode(writer.getBytes())).toEqual([
      {
        indices: [],
        timestamp: Timestamp.fromSeconds(1234),
      },
    ])
  })

  it('can read an entry with indices', () => {
    const writer = new ByteWriter()
      .writeNumber(1, 32)
      .writeNumber(2, 32)
      .writePadding(17)
      .write(encodeAssetId(AssetId('ETH-9')))
      .writeNumber(1n - MIN_INT, 32)
      .writePadding(17)
      .write(encodeAssetId(AssetId('BTC-10')))
      .writeNumber(-50n - MIN_INT, 32)
      .writeNumber(5678, 32)
    expect(decode(writer.getBytes())).toEqual([
      {
        indices: [
          { assetId: AssetId('ETH-9'), value: 1n },
          { assetId: AssetId('BTC-10'), value: -50n },
        ],
        timestamp: Timestamp.fromSeconds(5678),
      },
    ])
  })

  it('can read multiple entries', () => {
    const writer = new ByteWriter()
      .writeNumber(2, 32)
      .writeNumber(0, 32)
      .writeNumber(1234, 32)
      .writeNumber(2, 32)
      .writePadding(17)
      .write(encodeAssetId(AssetId('ETH-9')))
      .writeNumber(1n - MIN_INT, 32)
      .writePadding(17)
      .write(encodeAssetId(AssetId('BTC-10')))
      .writeNumber(-50n - MIN_INT, 32)
      .writeNumber(5678, 32)
    expect(decode(writer.getBytes())).toEqual([
      {
        indices: [],
        timestamp: Timestamp.fromSeconds(1234),
      },
      {
        indices: [
          { assetId: AssetId('ETH-9'), value: 1n },
          { assetId: AssetId('BTC-10'), value: -50n },
        ],
        timestamp: Timestamp.fromSeconds(5678),
      },
    ])
  })
})
