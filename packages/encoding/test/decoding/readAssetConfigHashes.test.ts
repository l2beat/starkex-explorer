import { AssetId, PedersenHash } from '@explorer/types'
import { expect } from 'earljs'

import { DecodingError } from '../../src'
import { readAssetConfigHashes } from '../../src/decoding/readAssetConfigHashes'
import { ByteWriter } from '../../src/encoding/ByteWriter'
import { encodeAssetId } from '../../src/encoding/encodeAssetId'
import { readToDecode } from './readToDecode'

describe(readAssetConfigHashes.name, () => {
  const decode = readToDecode(readAssetConfigHashes)

  it('fails for empty data', () => {
    expect(() => decode('')).toThrow(DecodingError, 'Went out of bounds')
  })

  it('can read zero values', () => {
    const writer = new ByteWriter().writeNumber(0, 32)
    expect(decode(writer.getBytes())).toEqual([])
  })

  it('can read a single value', () => {
    const hashEth = PedersenHash.fake()
    const writer = new ByteWriter()
      .writeNumber(1, 32)
      .writePadding(17)
      .write(encodeAssetId(AssetId('ETH-9')))
      .write(hashEth.toString())
    expect(decode(writer.getBytes())).toEqual([
      { assetId: AssetId('ETH-9'), hash: hashEth },
    ])
  })

  it('can read a multiple indices', () => {
    const hashEth = PedersenHash.fake()
    const hashBtc = PedersenHash.fake()
    const writer = new ByteWriter()
      .writeNumber(2, 32)
      .writePadding(17)
      .write(encodeAssetId(AssetId('ETH-9')))
      .write(hashEth.toString())
      .writePadding(17)
      .write(encodeAssetId(AssetId('BTC-10')))
      .write(hashBtc.toString())

    expect(decode(writer.getBytes())).toEqual([
      { assetId: AssetId('ETH-9'), hash: hashEth },
      { assetId: AssetId('BTC-10'), hash: hashBtc },
    ])
  })
})
