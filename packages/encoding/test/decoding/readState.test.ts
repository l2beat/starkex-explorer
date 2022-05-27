import { AssetId, PedersenHash, Timestamp } from '@explorer/types'
import { expect } from 'earljs'

import { DecodingError } from '../../src'
import { MIN_INT } from '../../src/constants'
import { readState } from '../../src/decoding/readState'
import { ByteWriter } from '../../src/encoding/ByteWriter'
import { encodeAssetId } from '../../src/encoding/encodeAssetId'
import { readToDecode } from './readToDecode'

describe('readState', () => {
  const decode = readToDecode(readState)

  it('fails for empty data', () => {
    expect(() => decode('')).toThrow(DecodingError, 'Went out of bounds')
  })

  it('decodes a simple state', () => {
    const positionRoot = PedersenHash.fake()
    const orderRoot = PedersenHash.fake()
    const writer = new ByteWriter()
      .writeNumber(8, 32)
      .write(positionRoot.toString())
      .writeNumber(10, 32)
      .write(orderRoot.toString())
      .writeNumber(12, 32)
      .writeNumber(0, 32)
      .writeNumber(1234, 32)
      .writeNumber(0, 32)
      .writeNumber(5678, 32)
    expect(decode(writer.getBytes())).toEqual({
      positionRoot,
      positionHeight: 10,
      orderRoot,
      orderHeight: 12,
      indices: [],
      timestamp: Timestamp.fromSeconds(1234),
      oraclePrices: [],
      systemTime: Timestamp.fromSeconds(5678),
    })
  })

  it('decodes state with indices and prices', () => {
    const positionRoot = PedersenHash.fake()
    const orderRoot = PedersenHash.fake()
    const writer = new ByteWriter()
      .writeNumber(16, 32)
      .write(positionRoot.toString())
      .writeNumber(10, 32)
      .write(orderRoot.toString())
      .writeNumber(12, 32)
      .writeNumber(2, 32)
      .writePadding(17)
      .write(encodeAssetId(AssetId('ETH-9')))
      .writeNumber(1n - MIN_INT, 32)
      .writePadding(17)
      .write(encodeAssetId(AssetId('BTC-10')))
      .writeNumber(-50n - MIN_INT, 32)
      .writeNumber(1234, 32)
      .writeNumber(2, 32)
      .writePadding(17)
      .write(encodeAssetId(AssetId('ETH-9')))
      .writeNumber(69n, 32)
      .writePadding(17)
      .write(encodeAssetId(AssetId('BTC-10')))
      .writeNumber(420n, 32)
      .writeNumber(5678, 32)
    expect(decode(writer.getBytes())).toEqual({
      positionRoot,
      positionHeight: 10,
      orderRoot,
      orderHeight: 12,
      indices: [
        {
          assetId: AssetId('ETH-9'),
          value: 1n,
        },
        {
          assetId: AssetId('BTC-10'),
          value: -50n,
        },
      ],
      timestamp: Timestamp.fromSeconds(1234),
      oraclePrices: [
        {
          assetId: AssetId('ETH-9'),
          price: 69n,
        },
        {
          assetId: AssetId('BTC-10'),
          price: 420n,
        },
      ],
      systemTime: Timestamp.fromSeconds(5678),
    })
  })
})
