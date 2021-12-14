import { expect } from 'chai'

import { encodeAssetId } from '../src/assetId'
import { decode } from '../src/decode'
import { DecodingError } from '../src/DecodingError'

describe('decode', () => {
  function encodeUint256(value: bigint | number) {
    return value.toString(16).padStart(64, '0')
  }

  it('fails for empty data', () => {
    expect(() => decode([])).to.throw(DecodingError, 'Went out of bounds')
  })

  it('decodes a single entry with a single index', () => {
    expect(
      decode([
        encodeUint256(1), // single entry
        encodeUint256(1), // single index
        encodeAssetId('ETH-9').padStart(64, '0'),
        encodeUint256(2n ** 63n + 1n), // funding index = 1
        encodeUint256(456), // timestamp
      ])
    ).to.deep.equal({
      funding: [
        {
          indices: [{ assetId: 'ETH-9', fundingIndex: 1n }],
          timestamp: 456n,
        },
      ],
      positions: [],
    })
  })

  it('decodes a single entry with a multiple indices', () => {
    expect(
      decode([
        encodeUint256(1), // single entry
        encodeUint256(3), // 3 indices
        encodeAssetId('ETH-9').padStart(64, '0'),
        encodeUint256(2n ** 63n + 100n), // funding index = 100
        encodeAssetId('BTC-10').padStart(64, '0'),
        encodeUint256(2n ** 63n - 200n), // funding index = -200
        encodeAssetId('ABC-1').padStart(64, '0'),
        encodeUint256(2n ** 63n), // funding index = 0
        encodeUint256(456), // timestamp
      ])
    ).to.deep.equal({
      funding: [
        {
          indices: [
            { assetId: 'ETH-9', fundingIndex: 100n },
            { assetId: 'BTC-10', fundingIndex: -200n },
            { assetId: 'ABC-1', fundingIndex: 0n },
          ],
          timestamp: 456n,
        },
      ],
      positions: [],
    })
  })

  it('decodes multiple entries with multiple indices', () => {
    expect(
      decode([
        encodeUint256(2), // 2 entries
        encodeUint256(3), // 3 indices
        encodeAssetId('ETH-9').padStart(64, '0'),
        encodeUint256(2n ** 63n + 100n), // funding index = 100
        encodeAssetId('BTC-10').padStart(64, '0'),
        encodeUint256(2n ** 63n - 200n), // funding index = -200
        encodeAssetId('ABC-1').padStart(64, '0'),
        encodeUint256(2n ** 63n), // funding index = 0
        encodeUint256(456), // timestamp
        encodeUint256(2), // 2 indices
        encodeAssetId('ETH-9').padStart(64, '0'),
        encodeUint256(2n ** 63n + 1n), // funding index = 1
        encodeAssetId('BTC-10').padStart(64, '0'),
        encodeUint256(2n ** 63n + 2n), // funding index = 2
        encodeUint256(789), // timestamp
      ])
    ).to.deep.equal({
      funding: [
        {
          indices: [
            { assetId: 'ETH-9', fundingIndex: 100n },
            { assetId: 'BTC-10', fundingIndex: -200n },
            { assetId: 'ABC-1', fundingIndex: 0n },
          ],
          timestamp: 456n,
        },
        {
          indices: [
            { assetId: 'ETH-9', fundingIndex: 1n },
            { assetId: 'BTC-10', fundingIndex: 2n },
          ],
          timestamp: 789n,
        },
      ],
      positions: [],
    })
  })
})
