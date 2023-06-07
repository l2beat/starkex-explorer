import { AssetId, PedersenHash, StarkKey } from '@explorer/types'
import { expect } from 'earl'

import { EXAMPLE_PERPETUAL_BATCH } from '../../test/starkwareData'
import { PerpetualBatchDataResponse } from './schema'
import { toPerpetualBatchData } from './toPerpetualBatchData'

describe(toPerpetualBatchData.name, () => {
  it('transforms a null update batch', () => {
    expect(toPerpetualBatchData({ update: null })).toEqual(undefined)
  })

  it('transforms the parsed batch', () => {
    const parsed = PerpetualBatchDataResponse.parse(EXAMPLE_PERPETUAL_BATCH)
    expect(toPerpetualBatchData(parsed)).toEqual({
      previousBatchId: 1205,
      positionRoot: PedersenHash(
        '00d766904591c4a3b7353f977e3b0be5c13dd1f1b028d6769828e4aa5861fd67'
      ),
      orderRoot: PedersenHash(
        '069a24e13bc5c49bfdff40f6f2e3277cb32503ed1e5a596959b88260faf61ee5'
      ),
      positions: [
        {
          positionId: 571n,
          starkKey: StarkKey(
            '0x031d3850b4a9181df48285a73fff1c2a9cccd46b61880a84f78c6be7a6a33a7e'
          ),
          collateralBalance: 9180000100890383028n,
          assets: [],
        },
        {
          positionId: 574n,
          starkKey: StarkKey(
            '0x00d2e4d8accd3f11347b01986cfc1be8fc968a778d7e34a17c21502866b8142d'
          ),
          collateralBalance: 5001991118880n,
          assets: [
            {
              assetId: AssetId('BTC-10'),
              balance: 1000000n,
              fundingIndex: 0n,
            },
          ],
        },
        {
          positionId: 614n,
          starkKey: StarkKey(
            '0x053adb1457fbaf4698fe4dea32d59b895c65586f5550e0fc3398265976f70cdc'
          ),
          collateralBalance: 5099993080820n,
          assets: [
            {
              assetId: AssetId('BTC-10'),
              balance: -1000000n,
              fundingIndex: 0n,
            },
          ],
        },
      ],
      orders: [
        { orderId: 33763544854418327n, amount: 10000000n },
        { orderId: 1943978849277734786n, amount: 10000000n },
        { orderId: 12319009954495611491n, amount: 9000000n },
        { orderId: 13566982546719579735n, amount: 10000000n },
      ],
    })
  })
})
