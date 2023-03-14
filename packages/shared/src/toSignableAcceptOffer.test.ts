import { recoverAddress } from '@ethersproject/transactions'
import { AssetId, StarkKey, Timestamp } from '@explorer/types'
import { expect } from 'earljs'

import { toSignableAcceptOffer } from './toSignableAcceptOffer'

// Mock data taken from real transaction:https://etherscan.io/tx/0x9b2dce5538d0c8c08511c9383be9b67da6f952b367baff0c8bdb5f66c9395634

const INITIAL = {
  starkKeyA: StarkKey(
    '05733b2b5e71223285e7966386a4e81d3c55480782af122227cf7d1b0b08c32e'
  ),
  positionIdA: BigInt('0x205'),
  syntheticAssetId: AssetId('AAVE-8'),
  collateralAmount: BigInt('0x684ee1800'),
  syntheticAmount: BigInt('0xf4240'),
  isABuyingSynthetic: true,
}

const ACCEPTED = {
  starkKeyB: StarkKey(
    '069913f789acdd07ff1aff8aa5dcf3d4935cf1d8b29d0f41839cd1be52dc4a41'
  ),
  positionIdB: BigInt('0x2ce'),
  submissionExpirationTime: Timestamp.fromHours(3456000000000n),
  nonce: BigInt(38404830),
  premiumCost: true,
  signature:
    '0x1bb089c2686c65d8d2e5800761b2826e0fc1f68f7e228fc161384958222bbc271458f40ed77507d59ca77c56204b0134b429eaface39b196d1f07e917a14c7641b',
}

const ETH_ADDRESS = '0xCE9a3e51B905997F1D098345a92B6c749A1f72B9'

describe(toSignableAcceptOffer.name, () => {
  it('works on an example tx', () => {
    const digest = toSignableAcceptOffer(INITIAL, ACCEPTED)
    expect(recoverAddress(digest, ACCEPTED.signature)).toEqual(ETH_ADDRESS)
  })
})
