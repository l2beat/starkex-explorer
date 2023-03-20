import { AssetId } from '@explorer/types'
import { expect } from 'earljs'

import { ByteWriter } from '../encoding/ByteWriter'
import { encodeAssetId } from '../encoding/encodeAssetId'
import { readToDecode } from '../test/readToDecode'
import { DecodingError } from './DecodingError'
import { readOraclePrices } from './readOraclePrices'

const collateralAssetId = AssetId('USDC-6')

describe('readOraclePrices', () => {
  const decode = readToDecode((reader) =>
    readOraclePrices(reader, collateralAssetId)
  )

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
      .write(encodeAssetId(AssetId('ETH-9')))
      .writeNumber(1n, 32)
    expect(decode(writer.getBytes())).toEqual([
      { assetId: AssetId('ETH-9'), price: 1n },
    ])
  })

  it('can read a multiple prices', () => {
    const writer = new ByteWriter()
      .writeNumber(3, 32)
      .writePadding(17)
      .write(encodeAssetId(AssetId('ETH-9')))
      .writeNumber(1n, 32)
      .writePadding(17)
      .write(encodeAssetId(AssetId('BTC-10')))
      .writeNumber(50n, 32)
      .writePadding(17)
      .write(encodeAssetId(AssetId('ABC-123')))
      .writeNumber(456n, 32)

    expect(decode(writer.getBytes())).toEqual([
      { assetId: AssetId('ETH-9'), price: 1n },
      { assetId: AssetId('BTC-10'), price: 50n },
      { assetId: AssetId('ABC-123'), price: 456n },
    ])
  })
})
