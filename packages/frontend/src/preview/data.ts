import { AssetId, Hash256, PedersenHash } from '@explorer/types'

import {
  HomeProps,
  PositionAtUpdateProps,
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
  totalPositions: 45762n,
  totalUpdates: 5143n,
}

export const STATE_CHANGE_DETAILS_PROPS: StateUpdateDetailsProps = {
  id: 1,
  hash: Hash256.fake(),
  rootHash: PedersenHash.fake(),
  blockNumber: Math.floor(Math.random() * 100),
  timestamp: Date.now(),
  positions: [
    {
      publicKey: `0x${'0'.repeat(63)}1`,
      positionId: 1n,
      totalUSDCents: 100n,
      previousTotalUSDCents: 90n,
    },
    {
      publicKey: `0x${'0'.repeat(63)}2`,
      positionId: 2n,
      totalUSDCents: 100n,
      previousTotalUSDCents: 90n,
    },
  ],
}

export const POSITION_DETAILS_PROPS: PositionDetailsProps = {
  positionId: 123n,
  publicKey: `0x${'0'.repeat(63)}1`,
  lastUpdateTimestamp: Date.now(),
  stateUpdateId: 1,
  assets: [
    { assetId: AssetId('ETH-9'), balance: 0n, totalUSDCents: 0n, price: 1000n },
    {
      assetId: AssetId('USDC-9'),
      balance: 20n,
      totalUSDCents: 20n,
      price: 1000n,
    },
    {
      assetId: AssetId('LINK-7'),
      balance: 20n,
      totalUSDCents: 20n,
      price: 1000n,
    },
    {
      assetId: AssetId('MKR-9'),
      balance: 30n,
      totalUSDCents: 30n,
      price: 1000n,
    },
    {
      assetId: AssetId('BTC-10'),
      balance: 5n,
      totalUSDCents: 5n,
      price: 1000n,
    },
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

export const POSITION_AT_UPDATE_PROPS: PositionAtUpdateProps = {
  stateUpdateId: 1,
  positionId: 123n,
  publicKey: `0x${'0'.repeat(63)}1`,
  previousPublicKey: `0x${'0'.repeat(63)}2`,
  lastUpdateTimestamp: Date.now(),
  assetChanges: [
    {
      assetId: AssetId('ETH-9'),
      previousBalance: 0n,
      currentBalance: 1234567n,
      balanceDiff: 1234567n,
    },
    {
      assetId: AssetId('BTC-10'),
      previousBalance: 12345678n,
      currentBalance: 1234567n,
      balanceDiff: -11111111n,
    },
    {
      assetId: AssetId('LINK-7'),
      previousBalance: 12345678n,
      currentBalance: 12345678n,
      balanceDiff: 0n,
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
