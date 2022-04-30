import {
  AssetId,
  EthereumAddress,
  Hash256,
  PedersenHash,
  StarkKey,
  Timestamp,
} from '@explorer/types'

import {
  ForcedTransactionDetailsProps,
  ForcedTransactionsIndexProps,
  HomeProps,
  PositionAtUpdateProps,
  PositionDetailsProps,
  StateUpdateDetailsProps,
  StateUpdatesIndexProps,
} from '../pages'
import { ForcedTransaction } from '../pages/forced-transactions/ForcedTransactionsIndexProps'

const ONE_HOUR = 60 * 60 * 1000

const createFakeTransactions = (count: number): ForcedTransaction[] =>
  Array.from({ length: count }).map((_, i) => ({
    type: i % 2 === 0 ? 'exit' : i % 3 === 0 ? 'buy' : 'sell',
    status: i % 3 === 0 ? 'waiting to be included' : 'completed',
    assetId: i % 2 === 0 ? AssetId('LINK-7') : AssetId('ETH-7'),
    lastUpdate: Timestamp(Date.now() - i * 1000 * 3600),
    hash: Hash256.fake(),
    amount: 10000n * (BigInt(i) + 1n),
    positionId: 100n * BigInt(i),
  }))

export const HOME_PROPS: HomeProps = {
  account: undefined,
  stateUpdates: Array.from({ length: 6 }).map((_, i) => ({
    id: i,
    hash: PedersenHash.fake(),
    positionCount: Math.floor(Math.random() * 30 + 4),
    timestamp: Timestamp(
      Date.now() - Math.floor(i * 6 * ONE_HOUR + Math.random() * 2 * ONE_HOUR)
    ),
  })),
  forcedTransactions: createFakeTransactions(10),
  totalPositions: 45762n,
  totalUpdates: 5143n,
}

export const STATE_CHANGE_DETAILS_PROPS: StateUpdateDetailsProps = {
  account: undefined,
  id: 1,
  hash: Hash256.fake(),
  rootHash: PedersenHash.fake(),
  blockNumber: Math.floor(Math.random() * 100),
  timestamp: Timestamp(Date.now()),
  positions: [
    {
      publicKey: StarkKey.fake(),
      positionId: 1n,
      totalUSDCents: 100n,
      previousTotalUSDCents: 90n,
    },
    {
      publicKey: StarkKey.fake(),
      positionId: 2n,
      totalUSDCents: 100n,
      previousTotalUSDCents: 90n,
    },
  ],
  transactions: createFakeTransactions(5),
}

export const POSITION_DETAILS_PROPS: PositionDetailsProps = {
  account: undefined,
  positionId: 123n,
  publicKey: StarkKey.fake(),
  ethAddress: '0x1234567890ABCDEF1234567890ABCDEF12345678',
  lastUpdateTimestamp: Timestamp(Date.now()),
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
  transactions: createFakeTransactions(5),
}

export const POSITION_AT_UPDATE_PROPS: PositionAtUpdateProps = {
  account: undefined,
  stateUpdateId: 1,
  positionId: 123n,
  publicKey: StarkKey.fake(),
  previousPublicKey: StarkKey.fake(),
  lastUpdateTimestamp: Timestamp(Date.now()),
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
  transactions: createFakeTransactions(5),
}

export const STATE_CHANGES_INDEX_PROPS: StateUpdatesIndexProps = {
  account: undefined,
  stateUpdates: Array.from({ length: 10 }).map((_, i) => ({
    id: i,
    hash: PedersenHash.fake(),
    positionCount: Math.floor(Math.random() * 30 + 4),
    timestamp: Timestamp(
      Date.now() - Math.floor(i * 6 * ONE_HOUR + Math.random() * 2 * ONE_HOUR)
    ),
  })),
  fullCount: 121,
  params: {
    perPage: 10,
    page: 5,
  },
}

export const FORCED_TRANSACTIONS_INDEX_PROPS: ForcedTransactionsIndexProps = {
  account: undefined,
  transactions: createFakeTransactions(50),
  params: {
    page: 1,
    perPage: 50,
  },
  fullCount: 100n,
}

export const FORCED_TRANSACTION_DETAILS_PROPS: ForcedTransactionDetailsProps = {
  account: undefined,
  ethereumAddress: EthereumAddress(
    '0x1234567890ABCDEF1234567890ABCDEF12345678'
  ),
  positionId: 1n,
  transactionHash: Hash256.fake(),
  value: 12345n,
  stateUpdateId: 1,
  history: [
    {
      timestamp: Timestamp(Date.now() - 100000),
      type: 'sent',
    },
    {
      timestamp: Timestamp(Date.now() - 10000),
      type: 'mined',
    },
    {
      timestamp: Timestamp(Date.now() - 1000),
      type: 'verified',
      stateUpdateId: 1,
    },
  ],
}
