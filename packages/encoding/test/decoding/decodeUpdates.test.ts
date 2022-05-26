import { AssetId, StarkKey, Timestamp } from '@explorer/types'
import { expect } from 'earljs'

import { MIN_INT } from '../../src/constants'
import { decodeUpdates } from '../../src/decoding/decodeUpdates'
import { DecodingError } from '../../src/decoding/DecodingError'
import { encodeAssetId } from '../../src/encodeAssetId'
import { ByteWriter } from './ByteWriter'

describe('decodeUpdates', () => {
  it('fails for empty data', () => {
    expect(() => decodeUpdates('')).toThrow(DecodingError, 'Went out of bounds')
  })

  it('decodes multiple entries and positions', () => {
    const writer = new ByteWriter()
      .writeNumber(2, 32) // 2 entries
      .writeNumber(3, 32) // 3 indices
      .writePadding(17)
      .write(encodeAssetId(AssetId('ETH-9')))
      .writeNumber(100n - MIN_INT, 32) // funding index = 100
      .writePadding(17)
      .write(encodeAssetId(AssetId('BTC-10')))
      .writeNumber(-200n - MIN_INT, 32) // funding index = -200
      .writePadding(17)
      .write(encodeAssetId(AssetId('ABC-1')))
      .writeNumber(0n - MIN_INT, 32) // funding index = 0
      .writeNumber(456, 32) // timestamp
      .writeNumber(2, 32) // 2 indices
      .writePadding(17)
      .write(encodeAssetId(AssetId('ETH-9')))
      .writeNumber(1n - MIN_INT, 32) // funding index = 1
      .writePadding(17)
      .write(encodeAssetId(AssetId('BTC-10')))
      .writeNumber(2n - MIN_INT, 32) // funding index = 2
      .writeNumber(789, 32) // timestamp
      .writeNumber(4 + 2, 32) // 2 values
      .writeNumber(123, 32) // positionId
      .write(StarkKey.fake('1234abcd').toString()) // publicKey
      .writeNumber(10n - MIN_INT, 32) // collateralBalance
      .writeNumber(456, 32) // fundingTimestamp
      .writePadding(9)
      .write(encodeAssetId(AssetId('ETH-9')))
      .writeNumber(50n - MIN_INT, 8)
      .writePadding(9)
      .write(encodeAssetId(AssetId('BTC-10')))
      .writeNumber(20n - MIN_INT, 8)
      .writeNumber(4 + 1, 32) // 1 value
      .writeNumber(124, 32) // positionId
      .write(StarkKey.fake('deadbeef').toString()) // publicKey
      .writeNumber(33n - MIN_INT, 32) // collateralBalance
      .writeNumber(457, 32) // fundingTimestamp
      .writePadding(9)
      .write(encodeAssetId(AssetId('ETH-9')))
      .writeNumber(66n - MIN_INT, 8)
    expect(decodeUpdates(writer.getBytes())).toEqual({
      funding: [
        {
          indices: [
            { assetId: AssetId('ETH-9'), value: 100n },
            { assetId: AssetId('BTC-10'), value: -200n },
            { assetId: AssetId('ABC-1'), value: 0n },
          ],
          timestamp: Timestamp.fromSeconds(456),
        },
        {
          indices: [
            { assetId: AssetId('ETH-9'), value: 1n },
            { assetId: AssetId('BTC-10'), value: 2n },
          ],
          timestamp: Timestamp.fromSeconds(789),
        },
      ],
      positions: [
        {
          positionId: 123n,
          publicKey: StarkKey.fake('1234abcd'),
          collateralBalance: 10n,
          fundingTimestamp: Timestamp.fromSeconds(456),
          balances: [
            { assetId: AssetId('ETH-9'), balance: 50n },
            { assetId: AssetId('BTC-10'), balance: 20n },
          ],
        },
        {
          positionId: 124n,
          publicKey: StarkKey.fake('deadbeef'),
          collateralBalance: 33n,
          fundingTimestamp: Timestamp.fromSeconds(457),
          balances: [{ assetId: AssetId('ETH-9'), balance: 66n }],
        },
      ],
    })
  })
})
