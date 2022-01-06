import { expect } from 'chai'

import { DecodingError } from '../src'
import { encodeAssetId } from '../src/encodeAssetId'
import { readAssetDataHashes } from '../src/readAssetDataHashes'
import { ByteWriter } from './ByteWriter'
import { readToDecode } from './readToDecode'

describe('readAssetDataHashes', () => {
  const decode = readToDecode(readAssetDataHashes)

  it('fails for empty data', () => {
    expect(() => decode('')).to.throw(DecodingError, 'Went out of bounds')
  })

  it('can read zero values', () => {
    const writer = new ByteWriter().writeNumber(0, 32)
    expect(decode(writer.getBytes())).to.deep.equal([])
  })

  it('can read a single value', () => {
    const writer = new ByteWriter()
      .writeNumber(1, 32)
      .writePadding(17)
      .write(encodeAssetId('ETH-9'))
      .write('abcd1234'.repeat(8))
    expect(decode(writer.getBytes())).to.deep.equal([
      { assetId: 'ETH-9', hash: '0x' + 'abcd1234'.repeat(8) },
    ])
  })

  it('can read a multiple indices', () => {
    const writer = new ByteWriter()
      .writeNumber(2, 32)
      .writePadding(17)
      .write(encodeAssetId('ETH-9'))
      .write('abcd1234'.repeat(8))
      .writePadding(17)
      .write(encodeAssetId('BTC-10'))
      .write('deadbeef'.repeat(8))

    expect(decode(writer.getBytes())).to.deep.equal([
      { assetId: 'ETH-9', hash: '0x' + 'abcd1234'.repeat(8) },
      { assetId: 'BTC-10', hash: '0x' + 'deadbeef'.repeat(8) },
    ])
  })
})
