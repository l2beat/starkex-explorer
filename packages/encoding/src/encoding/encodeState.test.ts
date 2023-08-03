import { AssetId, PedersenHash, Timestamp } from '@explorer/types'
import { expect } from 'earl'

import { State } from '../OnChainData'
import { encodeState, encodeStateAsInt256Array } from './encodeState'

const newState: State = {
  positionRoot: PedersenHash.fake('abc'),
  positionHeight: 64,
  orderRoot: PedersenHash.fake('def'),
  orderHeight: 64,
  indices: [
    { assetId: AssetId('ABC-3'), value: 1234n },
    { assetId: AssetId('DEF-6'), value: -4567n },
    { assetId: AssetId('GHI-9'), value: 7890n },
  ],
  timestamp: Timestamp.fromSeconds(69_421n),
  oraclePrices: [
    { assetId: AssetId('ABC-3'), price: 20_000n },
    { assetId: AssetId('DEF-6'), price: 300_000n },
    { assetId: AssetId('GHI-9'), price: 4_000_000n },
  ],
  systemTime: Timestamp.fromSeconds(1338n),
}

describe(encodeStateAsInt256Array.name, () => {
  describe(encodeState.name, () => {
    // encodeState is tested in encodeOnchainData.test.ts
  })

  it(`properly serialized state`, () => {
    const result = encodeStateAsInt256Array(newState)
    expect(result).toEqual([
      4855295734011000137694901532041540081493925748614200896918173841152119144448n,
      64n,
      6302343480064496903623622185149990345956635060155332823619769320010774740992n,
      64n,
      3n,
      338843257113973920573955727954018304n,
      9223372036854777042n,
      354481232606503678722675726851506176n,
      9223372036854771241n,
      370119208099033436871395725748994048n,
      9223372036854783698n,
      69421n,
      3n,
      338843257113973920573955727954018304n,
      20000n,
      354481232606503678722675726851506176n,
      300000n,
      370119208099033436871395725748994048n,
      4000000n,
      1338n,
    ])
  })
})
