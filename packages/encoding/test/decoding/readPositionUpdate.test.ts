import { AssetId, StarkKey, Timestamp } from '@explorer/types'
import { expect } from 'earljs'

import { DecodingError } from '../../src'
import { MIN_INT } from '../../src/constants'
import { readPositionUpdate } from '../../src/decoding/readPositionUpdate'
import { ByteWriter } from '../../src/encoding/ByteWriter'
import { encodeAssetId } from '../../src/encoding/encodeAssetId'
import { readToDecode } from './readToDecode'

describe('readPositionUpdate', () => {
  const decode = readToDecode(readPositionUpdate)

  it('fails for empty data', () => {
    expect(() => decode('')).toThrow(DecodingError, 'Went out of bounds')
  })

  it('decodes a position with no values', () => {
    const writer = new ByteWriter()
      .writeNumber(4, 32) // 0 values
      .writeNumber(123, 32) // positionId
      .write(StarkKey.fake('1234abcd').toString()) // publicKey
      .writeNumber(10n - MIN_INT, 32) // collateralBalance
      .writeNumber(456, 32) // fundingTimestamp
    expect(decode(writer.getBytes())).toEqual({
      positionId: 123n,
      publicKey: StarkKey.fake('1234abcd'),
      collateralBalance: 10n,
      fundingTimestamp: Timestamp.fromSeconds(456),
      balances: [],
    })
  })

  it('decodes a position with multiple values', () => {
    const writer = new ByteWriter()
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
    expect(decode(writer.getBytes())).toEqual({
      positionId: 123n,
      publicKey: StarkKey.fake('1234abcd'),
      collateralBalance: 10n,
      fundingTimestamp: Timestamp.fromSeconds(456),
      balances: [
        { assetId: AssetId('ETH-9'), balance: 50n },
        { assetId: AssetId('BTC-10'), balance: 20n },
      ],
    })
  })
})
