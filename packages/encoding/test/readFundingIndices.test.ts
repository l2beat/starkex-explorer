import { expect } from 'chai'

import { DecodingError } from '../src'
import { MIN_INT } from '../src/constants'
import { encodeAssetId } from '../src/decodeAssetId'
import { readFundingIndices } from '../src/readFundingIndices'
import { ByteWriter } from './ByteWriter'
import { readToDecode } from './readToDecode'

describe('readFundingIndices', () => {
  const decode = readToDecode(readFundingIndices)

  it('fails for empty data', () => {
    expect(() => decode('')).to.throw(DecodingError, 'Went out of bounds')
  })

  it('can read zero indices', () => {
    const writer = new ByteWriter().writeNumber(0, 32)
    expect(decode(writer.getBytes())).to.deep.equal([])
  })

  it('can read a single index', () => {
    const writer = new ByteWriter()
      .writeNumber(1, 32)
      .writePadding(17)
      .write(encodeAssetId('ETH-9'))
      .writeNumber(1n - MIN_INT, 32)
    expect(decode(writer.getBytes())).to.deep.equal([
      { assetId: 'ETH-9', value: 1n },
    ])
  })

  it('can read a multiple indices', () => {
    const writer = new ByteWriter()
      .writeNumber(3, 32)
      .writePadding(17)
      .write(encodeAssetId('ETH-9'))
      .writeNumber(1n - MIN_INT, 32)
      .writePadding(17)
      .write(encodeAssetId('BTC-10'))
      .writeNumber(-50n - MIN_INT, 32)
      .writePadding(17)
      .write(encodeAssetId('ABC-123'))
      .writeNumber(456n - MIN_INT, 32)

    expect(decode(writer.getBytes())).to.deep.equal([
      { assetId: 'ETH-9', value: 1n },
      { assetId: 'BTC-10', value: -50n },
      { assetId: 'ABC-123', value: 456n },
    ])
  })
})
