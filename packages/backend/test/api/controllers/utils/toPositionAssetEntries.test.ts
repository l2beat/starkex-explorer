import { AssetId } from '@explorer/types'
import { expect } from 'earljs'
import {
  getAssetValueUSDCents,
  toPositionAssetEntries,
} from '../../../../src/api/controllers/utils/toPositionAssetEntries'

describe(toPositionAssetEntries.name, () => {
  it('correctly calculates asset entries', () => {
    const result = toPositionAssetEntries(
      [
        { assetId: AssetId('1INCH-7'), balance: -277300000000n },
        { assetId: AssetId('AAVE-8'), balance: 215396000000n },
        { assetId: AssetId('ETH-9'), balance: 0n },
      ],
      1234567n,
      [
        { assetId: AssetId('1INCH-7'), price: 1255126913n },
        { assetId: AssetId('AAVE-8'), price: 14052211116n },
        { assetId: AssetId('ETH-9'), price: 14488213180n },
      ]
    )
    expect(result).toEqual([
      {
        assetId: AssetId('AAVE-8'),
        balance: 215396000000n,
        priceUSDCents: 32717n,
        totalUSDCents: 70472947n,
      },
      {
        assetId: AssetId('1INCH-7'),
        balance: -277300000000n,
        priceUSDCents: 292n,
        totalUSDCents: -8103593n,
      },
      {
        assetId: AssetId.USDC,
        balance: 1234567n,
        priceUSDCents: 100n,
        totalUSDCents: 123n,
      },
    ])
  })

  it('can return nothing', () => {
    const result = toPositionAssetEntries([], 0n, [])
    expect(result).toEqual([])
  })
})

describe(getAssetValueUSDCents.name, () => {
  const cases = [
    {
      balance: -277300000000n,
      assetId: '1INCH-7',
      price: 1255126913n,
      expected: -8103593n,
    },
    {
      balance: -215396000000n,
      assetId: 'AAVE-8',
      price: 14052211116n,
      expected: -70472947n,
    },
    {
      balance: -285673000000n,
      assetId: 'ADA-6',
      price: 10724665921n,
      expected: -71333429n,
    },
    {
      balance: -328262000000n,
      assetId: 'ATOM-7',
      price: 15028090569n,
      expected: -114858873n,
    },
    {
      balance: -618956000000n,
      assetId: 'AVAX-7',
      price: 24195607926n,
      expected: -348687560n,
    },
    {
      balance: -577546000000n,
      assetId: 'BTC-10',
      price: 20026633637n,
      expected: -269298957n,
    },
    {
      balance: -325860000000n,
      assetId: 'COMP-8',
      price: 16763506142n,
      expected: -127185045n,
    },
    {
      balance: -410769000000n,
      assetId: 'CRV-6',
      price: 9623519361n,
      expected: -92038964n,
    },
    {
      balance: -1433295000000n,
      assetId: 'DOGE-5',
      price: 10469411838n,
      expected: -349379974n,
    },
    {
      balance: -568800000000n,
      assetId: 'DOT-7',
      price: 15412821568n,
      expected: -204118269n,
    },
    {
      balance: -180105000000n,
      assetId: 'EOS-6',
      price: 20808699807n,
      expected: -87259124n,
    },
    {
      balance: -788301000000n,
      assetId: 'ETH-9',
      price: 14488213180n,
      expected: -265917576n,
    },
    {
      balance: -120664000000n,
      assetId: 'FIL-7',
      price: 35399340509n,
      expected: -99451887n,
    },
    {
      balance: -411581000000n,
      assetId: 'LINK-7',
      price: 11854963939n,
      expected: -113604541n,
    },
    {
      balance: -703772000000n,
      assetId: 'LTC-8',
      price: 9910637036n,
      expected: -162395389n,
    },
    {
      balance: -1319368000000n,
      assetId: 'MATIC-6',
      price: 5524885225n,
      expected: -169718562n,
    },
    {
      balance: -224510000000n,
      assetId: 'MKR-9',
      price: 12298471670n,
      expected: -64287564n,
    },
    {
      balance: -979966000000n,
      assetId: 'SNX-7',
      price: 4809859079n,
      expected: -109744685n,
    },
    {
      balance: -45546000000n,
      assetId: 'SOL-7',
      price: 71269520747n,
      expected: -75577795n,
    },
    {
      balance: -1080388000000n,
      assetId: 'SUSHI-7',
      price: 4696666489n,
      expected: -118143440n,
    },
    {
      balance: -104232000000n,
      assetId: 'UMA-7',
      price: 4592525755n,
      expected: -11145326n,
    },
    {
      balance: -340439000000n,
      assetId: 'UNI-7',
      price: 9973128062n,
      expected: -79051632n,
    },
    {
      balance: -182225000000n,
      assetId: 'YFI-10',
      price: 14379730896n,
      expected: -61009695n,
    },
  ]

  cases.forEach(({ balance, price, assetId, expected }) => {
    it(`calculates ${assetId} value properly`, () => {
      expect(getAssetValueUSDCents(balance, price)).toEqual(expected)
    })
  })
})
