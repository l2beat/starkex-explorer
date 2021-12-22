import { expect } from 'chai'

import { encodeAssetId } from '../src/assetId'
import { decodeUpdates } from '../src/decodeUpdates'
import { DecodingError } from '../src/DecodingError'
import REAL_DECODED from './data/onchain-decoded.json'
import REAL_DATA from './data/onchain-example.json'

const OFFSET = 2n ** 63n

describe('decodeUpdates', () => {
  function encodeUint256(value: bigint | number) {
    return value.toString(16).padStart(64, '0')
  }

  function encodeUint64(value: bigint | number) {
    return value.toString(16).padStart(16, '0')
  }

  function encodePositionValue(assetId: string, value: bigint) {
    return encodeAssetId(assetId)
      .padStart(48, '0')
      .concat(encodeUint64(OFFSET + value))
  }

  it('fails for empty data', () => {
    expect(() => decodeUpdates([])).to.throw(DecodingError, 'Went out of bounds')
  })

  it('decodes a single entry with a single index', () => {
    expect(
      decodeUpdates([
        encodeUint256(1), // single entry
        encodeUint256(1), // single index
        encodeAssetId('ETH-9').padStart(64, '0'),
        encodeUint256(OFFSET + 1n), // funding index = 1
        encodeUint256(456), // timestamp
      ])
    ).to.deep.equal({
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
    expect(
      decodeUpdates([
        encodeUint256(1), // single entry
        encodeUint256(3), // 3 indices
        encodeAssetId('ETH-9').padStart(64, '0'),
        encodeUint256(OFFSET + 100n), // funding index = 100
        encodeAssetId('BTC-10').padStart(64, '0'),
        encodeUint256(OFFSET - 200n), // funding index = -200
        encodeAssetId('ABC-1').padStart(64, '0'),
        encodeUint256(OFFSET), // funding index = 0
        encodeUint256(456), // timestamp
      ])
    ).to.deep.equal({
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
    expect(
      decodeUpdates([
        encodeUint256(2), // 2 entries
        encodeUint256(3), // 3 indices
        encodeAssetId('ETH-9').padStart(64, '0'),
        encodeUint256(OFFSET + 100n), // funding index = 100
        encodeAssetId('BTC-10').padStart(64, '0'),
        encodeUint256(OFFSET - 200n), // funding index = -200
        encodeAssetId('ABC-1').padStart(64, '0'),
        encodeUint256(OFFSET), // funding index = 0
        encodeUint256(456), // timestamp
        encodeUint256(2), // 2 indices
        encodeAssetId('ETH-9').padStart(64, '0'),
        encodeUint256(OFFSET + 1n), // funding index = 1
        encodeAssetId('BTC-10').padStart(64, '0'),
        encodeUint256(OFFSET + 2n), // funding index = 2
        encodeUint256(789), // timestamp
      ])
    ).to.deep.equal({
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
    expect(
      decodeUpdates([
        encodeUint256(0), // 0 entries
        encodeUint256(4), // 0 values
        encodeUint256(123), // positionId
        '1234abcd'.repeat(8), // publicKey
        encodeUint256(OFFSET + 10n), // collateralBalance
        encodeUint256(456), // fundingTimestamp
      ])
    ).to.deep.equal({
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
    expect(
      decodeUpdates([
        encodeUint256(0), // 0 entries
        encodeUint256(4 + 2), // 2 values
        encodeUint256(123), // positionId
        '1234abcd'.repeat(8), // publicKey
        encodeUint256(OFFSET + 10n), // collateralBalance
        encodeUint256(456), // fundingTimestamp
        encodePositionValue('ETH-9', 50n),
        encodePositionValue('BTC-10', 20n),
      ])
    ).to.deep.equal({
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
    expect(
      decodeUpdates([
        encodeUint256(0), // 0 entries
        encodeUint256(4 + 2), // 2 values
        encodeUint256(123), // positionId
        '1234abcd'.repeat(8), // publicKey
        encodeUint256(OFFSET + 10n), // collateralBalance
        encodeUint256(456), // fundingTimestamp
        encodePositionValue('ETH-9', 50n),
        encodePositionValue('BTC-10', 20n),
        encodeUint256(4 + 1), // 1 value
        encodeUint256(124), // positionId
        'deadbeef'.repeat(8), // publicKey
        encodeUint256(OFFSET + 33n), // collateralBalance
        encodeUint256(457), // fundingTimestamp
        encodePositionValue('ETH-9', 66n),
      ])
    ).to.deep.equal({
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
    expect(
      decodeUpdates([
        encodeUint256(2), // 2 entries
        encodeUint256(3), // 3 indices
        encodeAssetId('ETH-9').padStart(64, '0'),
        encodeUint256(OFFSET + 100n), // funding index = 100
        encodeAssetId('BTC-10').padStart(64, '0'),
        encodeUint256(OFFSET - 200n), // funding index = -200
        encodeAssetId('ABC-1').padStart(64, '0'),
        encodeUint256(OFFSET), // funding index = 0
        encodeUint256(456), // timestamp
        encodeUint256(2), // 2 indices
        encodeAssetId('ETH-9').padStart(64, '0'),
        encodeUint256(OFFSET + 1n), // funding index = 1
        encodeAssetId('BTC-10').padStart(64, '0'),
        encodeUint256(OFFSET + 2n), // funding index = 2
        encodeUint256(789), // timestamp
        encodeUint256(4 + 2), // 2 values
        encodeUint256(123), // positionId
        '1234abcd'.repeat(8), // publicKey
        encodeUint256(OFFSET + 10n), // collateralBalance
        encodeUint256(456), // fundingTimestamp
        encodePositionValue('ETH-9', 50n),
        encodePositionValue('BTC-10', 20n),
        encodeUint256(4 + 1), // 1 value
        encodeUint256(124), // positionId
        'deadbeef'.repeat(8), // publicKey
        encodeUint256(OFFSET + 33n), // collateralBalance
        encodeUint256(457), // fundingTimestamp
        encodePositionValue('ETH-9', 66n),
      ])
    ).to.deep.equal({
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

  it('decodes real onchain data', () => {
    // TODO: don't skip first page
    const decoded = decodeUpdates(REAL_DATA.slice(1).flat())
    const noBigInt = JSON.parse(
      JSON.stringify(decoded, (k, v) => (typeof v === 'bigint' ? Number(v) : v))
    )
    expect(noBigInt).to.deep.equal(REAL_DECODED)
  })
})
