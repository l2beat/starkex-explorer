import { expect } from 'chai'

import { encodeAssetId } from '../src/decodeAssetId'
import { decodeUpdates } from '../src/decodeUpdates'
import { DecodingError } from '../src/DecodingError'
import { ByteWriter } from './ByteWriter'

const OFFSET = 2n ** 63n

describe('decodeUpdates', () => {
  it('fails for empty data', () => {
    expect(() => decodeUpdates('')).to.throw(
      DecodingError,
      'Went out of bounds'
    )
  })

  it('decodes a single entry with a single index', () => {
    const writer = new ByteWriter()
      .writeNumber(1, 32) // single entry
      .writeNumber(1, 32) // single index
      .writePadding(17)
      .write(encodeAssetId('ETH-9'))
      .writeNumber(OFFSET + 1n, 32) // funding index = 1
      .writeNumber(456, 32) // timestamp
    expect(decodeUpdates(writer.getBytes())).to.deep.equal({
      funding: [
        {
          indices: [{ assetId: 'ETH-9', value: 1n }],
          timestamp: 456n,
        },
      ],
      positions: [],
    })
  })

  it('decodes a single entry with a multiple indices', () => {
    const writer = new ByteWriter()
      .writeNumber(1, 32) // single entry
      .writeNumber(3, 32) // 3 indices
      .writePadding(17)
      .write(encodeAssetId('ETH-9'))
      .writeNumber(OFFSET + 100n, 32) // funding index = 100
      .writePadding(17)
      .write(encodeAssetId('BTC-10'))
      .writeNumber(OFFSET - 200n, 32) // funding index = -200
      .writePadding(17)
      .write(encodeAssetId('ABC-1'))
      .writeNumber(OFFSET, 32) // funding index = 0
      .writeNumber(456, 32) // timestamp
    expect(decodeUpdates(writer.getBytes())).to.deep.equal({
      funding: [
        {
          indices: [
            { assetId: 'ETH-9', value: 100n },
            { assetId: 'BTC-10', value: -200n },
            { assetId: 'ABC-1', value: 0n },
          ],
          timestamp: 456n,
        },
      ],
      positions: [],
    })
  })

  it('decodes multiple entries with multiple indices', () => {
    const writer = new ByteWriter()
      .writeNumber(2, 32) // 2 entries
      .writeNumber(3, 32) // 3 indices
      .writePadding(17)
      .write(encodeAssetId('ETH-9'))
      .writeNumber(OFFSET + 100n, 32) // funding index = 100
      .writePadding(17)
      .write(encodeAssetId('BTC-10'))
      .writeNumber(OFFSET - 200n, 32) // funding index = -200
      .writePadding(17)
      .write(encodeAssetId('ABC-1'))
      .writeNumber(OFFSET, 32) // funding index = 0
      .writeNumber(456, 32) // timestamp
      .writeNumber(2, 32) // 2 indices
      .writePadding(17)
      .write(encodeAssetId('ETH-9'))
      .writeNumber(OFFSET + 1n, 32) // funding index = 1
      .writePadding(17)
      .write(encodeAssetId('BTC-10'))
      .writeNumber(OFFSET + 2n, 32) // funding index = 2
      .writeNumber(789, 32) // timestamp
    expect(decodeUpdates(writer.getBytes())).to.deep.equal({
      funding: [
        {
          indices: [
            { assetId: 'ETH-9', value: 100n },
            { assetId: 'BTC-10', value: -200n },
            { assetId: 'ABC-1', value: 0n },
          ],
          timestamp: 456n,
        },
        {
          indices: [
            { assetId: 'ETH-9', value: 1n },
            { assetId: 'BTC-10', value: 2n },
          ],
          timestamp: 789n,
        },
      ],
      positions: [],
    })
  })

  it('decodes a single position with no values', () => {
    const writer = new ByteWriter()
      .writeNumber(0, 32) // 0 entries
      .writeNumber(4, 32) // 0 values
      .writeNumber(123, 32) // positionId
      .write('1234abcd'.repeat(8)) // publicKey
      .writeNumber(OFFSET + 10n, 32) // collateralBalance
      .writeNumber(456, 32) // fundingTimestamp
    expect(decodeUpdates(writer.getBytes())).to.deep.equal({
      funding: [],
      positions: [
        {
          positionId: 123n,
          publicKey: '0x' + '1234abcd'.repeat(8),
          collateralBalance: 10n,
          fundingTimestamp: 456n,
          balances: [],
        },
      ],
    })
  })

  it('decodes a single position with multiple values', () => {
    const writer = new ByteWriter()
      .writeNumber(0, 32) // 0 entries
      .writeNumber(4 + 2, 32) // 2 values
      .writeNumber(123, 32) // positionId
      .write('1234abcd'.repeat(8)) // publicKey
      .writeNumber(OFFSET + 10n, 32) // collateralBalance
      .writeNumber(456, 32) // fundingTimestamp
      .writePadding(9)
      .write(encodeAssetId('ETH-9'))
      .writeNumber(OFFSET + 50n, 8)
      .writePadding(9)
      .write(encodeAssetId('BTC-10'))
      .writeNumber(OFFSET + 20n, 8)
    expect(decodeUpdates(writer.getBytes())).to.deep.equal({
      funding: [],
      positions: [
        {
          positionId: 123n,
          publicKey: '0x' + '1234abcd'.repeat(8),
          collateralBalance: 10n,
          fundingTimestamp: 456n,
          balances: [
            { assetId: 'ETH-9', balance: 50n },
            { assetId: 'BTC-10', balance: 20n },
          ],
        },
      ],
    })
  })

  it('decodes multiple positions with multiple values', () => {
    const writer = new ByteWriter()
      .writeNumber(0, 32) // 0 entries
      .writeNumber(4 + 2, 32) // 2 values
      .writeNumber(123, 32) // positionId
      .write('1234abcd'.repeat(8)) // publicKey
      .writeNumber(OFFSET + 10n, 32) // collateralBalance
      .writeNumber(456, 32) // fundingTimestamp
      .writePadding(9)
      .write(encodeAssetId('ETH-9'))
      .writeNumber(OFFSET + 50n, 8)
      .writePadding(9)
      .write(encodeAssetId('BTC-10'))
      .writeNumber(OFFSET + 20n, 8)
      .writeNumber(4 + 1, 32) // 1 value
      .writeNumber(124, 32) // positionId
      .write('deadbeef'.repeat(8)) // publicKey
      .writeNumber(OFFSET + 33n, 32) // collateralBalance
      .writeNumber(457, 32) // fundingTimestamp
      .writePadding(9)
      .write(encodeAssetId('ETH-9'))
      .writeNumber(OFFSET + 66n, 8)
    expect(decodeUpdates(writer.getBytes())).to.deep.equal({
      funding: [],
      positions: [
        {
          positionId: 123n,
          publicKey: '0x' + '1234abcd'.repeat(8),
          collateralBalance: 10n,
          fundingTimestamp: 456n,
          balances: [
            { assetId: 'ETH-9', balance: 50n },
            { assetId: 'BTC-10', balance: 20n },
          ],
        },
        {
          positionId: 124n,
          publicKey: '0x' + 'deadbeef'.repeat(8),
          collateralBalance: 33n,
          fundingTimestamp: 457n,
          balances: [{ assetId: 'ETH-9', balance: 66n }],
        },
      ],
    })
  })

  it('decodes multiple entries and positions', () => {
    const writer = new ByteWriter()
      .writeNumber(2, 32) // 2 entries
      .writeNumber(3, 32) // 3 indices
      .writePadding(17)
      .write(encodeAssetId('ETH-9'))
      .writeNumber(OFFSET + 100n, 32) // funding index = 100
      .writePadding(17)
      .write(encodeAssetId('BTC-10'))
      .writeNumber(OFFSET - 200n, 32) // funding index = -200
      .writePadding(17)
      .write(encodeAssetId('ABC-1'))
      .writeNumber(OFFSET, 32) // funding index = 0
      .writeNumber(456, 32) // timestamp
      .writeNumber(2, 32) // 2 indices
      .writePadding(17)
      .write(encodeAssetId('ETH-9'))
      .writeNumber(OFFSET + 1n, 32) // funding index = 1
      .writePadding(17)
      .write(encodeAssetId('BTC-10'))
      .writeNumber(OFFSET + 2n, 32) // funding index = 2
      .writeNumber(789, 32) // timestamp
      .writeNumber(4 + 2, 32) // 2 values
      .writeNumber(123, 32) // positionId
      .write('1234abcd'.repeat(8)) // publicKey
      .writeNumber(OFFSET + 10n, 32) // collateralBalance
      .writeNumber(456, 32) // fundingTimestamp
      .writePadding(9)
      .write(encodeAssetId('ETH-9'))
      .writeNumber(OFFSET + 50n, 8)
      .writePadding(9)
      .write(encodeAssetId('BTC-10'))
      .writeNumber(OFFSET + 20n, 8)
      .writeNumber(4 + 1, 32) // 1 value
      .writeNumber(124, 32) // positionId
      .write('deadbeef'.repeat(8)) // publicKey
      .writeNumber(OFFSET + 33n, 32) // collateralBalance
      .writeNumber(457, 32) // fundingTimestamp
      .writePadding(9)
      .write(encodeAssetId('ETH-9'))
      .writeNumber(OFFSET + 66n, 8)
    expect(decodeUpdates(writer.getBytes())).to.deep.equal({
      funding: [
        {
          indices: [
            { assetId: 'ETH-9', value: 100n },
            { assetId: 'BTC-10', value: -200n },
            { assetId: 'ABC-1', value: 0n },
          ],
          timestamp: 456n,
        },
        {
          indices: [
            { assetId: 'ETH-9', value: 1n },
            { assetId: 'BTC-10', value: 2n },
          ],
          timestamp: 789n,
        },
      ],
      positions: [
        {
          positionId: 123n,
          publicKey: '0x' + '1234abcd'.repeat(8),
          collateralBalance: 10n,
          fundingTimestamp: 456n,
          balances: [
            { assetId: 'ETH-9', balance: 50n },
            { assetId: 'BTC-10', balance: 20n },
          ],
        },
        {
          positionId: 124n,
          publicKey: '0x' + 'deadbeef'.repeat(8),
          collateralBalance: 33n,
          fundingTimestamp: 457n,
          balances: [{ assetId: 'ETH-9', balance: 66n }],
        },
      ],
    })
  })
})
