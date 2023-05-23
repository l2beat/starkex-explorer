import { UserDetails } from '@explorer/shared'
import { AssetId, EthereumAddress, StarkKey } from '@explorer/types'

import { amountBucket } from './buckets'
import { randomFutureTimestamp, randomId } from './utils'

export function randomRecipient() {
  return {
    ethereumAddress: EthereumAddress.fake(),
    starkKey: StarkKey.fake(),
  }
}

export function randomParty() {
  return {
    ethereumAddress: EthereumAddress.fake(),
    starkKey: StarkKey.fake(),
    positionId: randomId(),
  }
}

export function userParty(user: UserDetails | undefined) {
  return {
    ethereumAddress: user?.address ?? EthereumAddress.fake(),
    starkKey: user?.starkKey ?? StarkKey.fake(),
    positionId: randomId(),
  }
}

export function randomOfferDetails() {
  return {
    offerId: randomId(),
    type: Math.random() > 0.5 ? ('BUY' as const) : ('SELL' as const),
    collateralAsset: { hashOrId: AssetId('USDC-6') },
    collateralAmount: amountBucket.pick(),
    syntheticAsset: { hashOrId: AssetId('BTC-10') },
    syntheticAmount: amountBucket.pick(),
    expirationTimestamp: randomFutureTimestamp(),
  }
}
