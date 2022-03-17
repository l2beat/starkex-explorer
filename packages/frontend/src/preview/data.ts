import { PedersenHash } from '@explorer/types'

import {
  HomeProps,
  PositionDetailsProps,
  StateUpdateDetailsProps,
  StateUpdatesIndexProps,
} from '../pages'

const ONE_HOUR = 60 * 60 * 1000

export const HOME_PROPS: HomeProps = {
  stateUpdates: Array.from({ length: 6 }).map((_, i) => ({
    id: i,
    hash: PedersenHash.fake(),
    positionCount: Math.floor(Math.random() * 30 + 4),
    timestamp:
      Date.now() - Math.floor(i * 6 * ONE_HOUR + Math.random() * 2 * ONE_HOUR),
  })),
}

export const STATE_CHANGE_DETAILS_PROPS: StateUpdateDetailsProps = {
  id: 1,
  hash: PedersenHash.fake(),
  timestamp: Date.now() / 1000,
  positions: [
    {
      publicKey: `0x${'0'.repeat(63)}1`,
      positionId: 1n,
      totalUSDCents: 100n,
    },
    {
      publicKey: `0x${'0'.repeat(63)}2`,
      positionId: 2n,
      totalUSDCents: 100n,
    },
  ],
}

export const POSITION_DETAILS_PROPS: PositionDetailsProps = {
  positionId: 123n,
  publicKey: `0x${'0'.repeat(63)}1`,
  totalUSDCents: 123n,
  assets: [
    { assetId: 'ETH-9', balance: 0n, totalUSDCents: 0n, price: 1000n },
    { assetId: 'USDC-9', balance: 20n, totalUSDCents: 20n, price: 1000n },
    { assetId: 'LINK-7', balance: 20n, totalUSDCents: 20n, price: 1000n },
    { assetId: 'MKR-9', balance: 30n, totalUSDCents: 30n, price: 1000n },
    { assetId: 'BTC-10', balance: 5n, totalUSDCents: 5n, price: 1000n },
  ],
  history: [
    {
      stateUpdateId: 12,
      totalUSDCents: 100n,
      assetsUpdated: 10,
    },
    {
      stateUpdateId: 11,
      totalUSDCents: 222n,
      assetsUpdated: 20,
    },
  ],
}

export const STATE_CHANGES_INDEX_PROPS: StateUpdatesIndexProps = {
  stateUpdates: Array.from({ length: 10 }).map((_, i) => ({
    id: i,
    hash: PedersenHash.fake(),
    positionCount: Math.floor(Math.random() * 30 + 4),
    timestamp:
      Date.now() - Math.floor(i * 6 * ONE_HOUR + Math.random() * 2 * ONE_HOUR),
  })),
  fullCount: 121,
  params: {
    perPage: 10,
    page: 5,
  },
}
