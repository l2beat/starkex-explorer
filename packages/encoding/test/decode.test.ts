import { expect } from 'chai'

import { decode } from '../src/decode'

describe('decode', () => {
  function encodeUint256(value: bigint | number) {
    return value.toString(16).padStart(64, '0')
  }

  it('fails for empty data', () => {
    expect(() => decode([])).to.throw('Data malformed')
  })

  it('decodes a single entry with a single index', () => {
    expect(
      decode([
        encodeUint256(1), // single entry
        encodeUint256(1), // single index
        encodeUint256(123), // asset id
        encodeUint256(2n ** 63n + 1n), // funding index = 1
        encodeUint256(456), // timestamp
      ])
    ).to.deep.equal({
      funding: [
        {
          indices: [{ assetId: 123n, fundingIndex: 1n }],
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
        encodeUint256(100), // asset id
        encodeUint256(2n ** 63n + 100n), // funding index = 100
        encodeUint256(200), // asset id
        encodeUint256(2n ** 63n - 200n), // funding index = -200
        encodeUint256(300), // asset id
        encodeUint256(2n ** 63n), // funding index = 0
        encodeUint256(456), // timestamp
      ])
    ).to.deep.equal({
      funding: [
        {
          indices: [
            { assetId: 100n, fundingIndex: 100n },
            { assetId: 200n, fundingIndex: -200n },
            { assetId: 300n, fundingIndex: 0n },
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
        encodeUint256(100), // asset id
        encodeUint256(2n ** 63n + 100n), // funding index = 100
        encodeUint256(200), // asset id
        encodeUint256(2n ** 63n - 200n), // funding index = -200
        encodeUint256(300), // asset id
        encodeUint256(2n ** 63n), // funding index = 0
        encodeUint256(456), // timestamp
        encodeUint256(2), // 2 indices
        encodeUint256(100), // asset id
        encodeUint256(2n ** 63n + 1n), // funding index = 1
        encodeUint256(200), // asset id
        encodeUint256(2n ** 63n + 2n), // funding index = 2
        encodeUint256(789), // timestamp
      ])
    ).to.deep.equal({
      funding: [
        {
          indices: [
            { assetId: 100n, fundingIndex: 100n },
            { assetId: 200n, fundingIndex: -200n },
            { assetId: 300n, fundingIndex: 0n },
          ],
          timestamp: 456n,
        },
        {
          indices: [
            { assetId: 100n, fundingIndex: 1n },
            { assetId: 200n, fundingIndex: 2n },
          ],
          timestamp: 789n,
        },
      ],
      positions: [],
    })
  })
})
