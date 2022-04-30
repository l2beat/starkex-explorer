import { AssetId, StarkKey } from '@explorer/types'
import { expect } from 'earljs'

import { DecodingError, encodeAssetId } from '../src'
import { readForcedActions } from '../src/readForcedActions'
import { ByteWriter } from './ByteWriter'
import { readToDecode } from './readToDecode'

describe(readForcedActions.name, () => {
  const decode = readToDecode(readForcedActions)

  it('fails for empty data', () => {
    expect(() => decode('')).toThrow(DecodingError, 'Went out of bounds')
  })

  it('can read zero forced actions', () => {
    const writer = new ByteWriter().writeNumber(0, 32)
    expect(decode(writer.getBytes())).toEqual([])
  })

  it('can read a single forced withdrawal', () => {
    const writer = new ByteWriter()
      .writeNumber(1, 32)
      .writeNumber(0, 32)
      .write('1234abcd'.repeat(8))
      .writeNumber(123, 32)
      .writeNumber(1500100900n, 32)
    expect(decode(writer.getBytes())).toEqual([
      {
        type: 'withdrawal',
        publicKey: StarkKey('0x' + '1234abcd'.repeat(8)),
        positionId: 123n,
        amount: 1500100900n,
      },
    ])
  })

  it('can read a single forced trade', () => {
    const writer = new ByteWriter()
      .writeNumber(1, 32)
      .writeNumber(1, 32)
      .write('1234abcd'.repeat(8))
      .write('deadbeef'.repeat(8))
      .writeNumber(123, 32)
      .writeNumber(456, 32)
      .writePadding(17)
      .write(encodeAssetId(AssetId('ETH-9')))
      .writeNumber(1000, 32)
      .writeNumber(2000, 32)
      .writeNumber(1, 32)
      .writeNumber(69420, 32)
    expect(decode(writer.getBytes())).toEqual([
      {
        type: 'trade',
        publicKeyA: StarkKey('0x' + '1234abcd'.repeat(8)),
        publicKeyB: StarkKey('0x' + 'deadbeef'.repeat(8)),
        positionIdA: 123n,
        positionIdB: 456n,
        syntheticAssetId: AssetId('ETH-9'),
        collateralAmount: 1000n,
        syntheticAmount: 2000n,
        isABuyingSynthetic: true,
        nonce: 69420n,
      },
    ])
  })

  it('can read multiple forced actions', () => {
    const writer = new ByteWriter()
      .writeNumber(2, 32)
      .writeNumber(0, 32)
      .write('1234abcd'.repeat(8))
      .writeNumber(123, 32)
      .writeNumber(1500100900n, 32)
      .writeNumber(1, 32)
      .write('1234abcd'.repeat(8))
      .write('deadbeef'.repeat(8))
      .writeNumber(123, 32)
      .writeNumber(456, 32)
      .writePadding(17)
      .write(encodeAssetId(AssetId('ETH-9')))
      .writeNumber(1000, 32)
      .writeNumber(2000, 32)
      .writeNumber(1, 32)
      .writeNumber(69420, 32)

    expect(decode(writer.getBytes())).toEqual([
      {
        type: 'withdrawal',
        publicKey: StarkKey('0x' + '1234abcd'.repeat(8)),
        positionId: 123n,
        amount: 1500100900n,
      },
      {
        type: 'trade',
        publicKeyA: StarkKey('0x' + '1234abcd'.repeat(8)),
        publicKeyB: StarkKey('0x' + 'deadbeef'.repeat(8)),
        positionIdA: 123n,
        positionIdB: 456n,
        syntheticAssetId: AssetId('ETH-9'),
        collateralAmount: 1000n,
        syntheticAmount: 2000n,
        isABuyingSynthetic: true,
        nonce: 69420n,
      },
    ])
  })
})
