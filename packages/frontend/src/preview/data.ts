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
import { ForcedTransactionEntry } from '../pages/forced-transactions/ForcedTransactionsIndexProps'
import { TransactionFormProps } from '../pages/transaction-form'

const ONE_HOUR = 60 * 60 * 1000

const createFakeTransactions = (count: number): ForcedTransactionEntry[] =>
  Array.from({ length: count }).map((_, i) => {
    const assets = [AssetId('LINK-7'), AssetId('MKR-9'), AssetId('BTC-10')]
    const assetId = assets[Math.floor(Math.random() * assets.length)]

    const types = ['exit', 'buy', 'sell'] as const
    const type = types[Math.floor(Math.random() * types.length)]

    const statuses = ['waiting to be included', 'completed'] as const
    const status = statuses[Math.floor(Math.random() * statuses.length)]

    const decimals = AssetId.decimals(assetId)
    const digits = Math.floor(Math.random() * decimals + 6)
    const randomDigit = () => '0123456789'[Math.floor(Math.random() * 10)]
    const amount = Array.from({ length: digits }).map(randomDigit).join('')

    return {
      type,
      status,
      assetId,
      lastUpdate: Timestamp(Date.now() - i * 1000 * 3600),
      hash: Hash256.fake(),
      amount: BigInt(amount),
      positionId: BigInt(Math.floor(Math.random() * 10_000 + 1)),
    }
  })

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
  positions: Array.from({ length: 57 }).map((_, i) => ({
    publicKey: StarkKey.fake(),
    positionId: BigInt(i + 1),
    totalUSDCents: BigInt(Math.floor(Math.random() * 500_000_00)),
    previousTotalUSDCents: BigInt(Math.floor(Math.random() * 500_000_00)),
    assetsUpdated: Math.floor(Math.random() * 20 + 1),
  })),
  transactions: createFakeTransactions(7),
}

export const POSITION_DETAILS_PROPS: PositionDetailsProps = {
  account: undefined,
  positionId: 123n,
  publicKey: StarkKey.fake(),
  ethAddress: EthereumAddress.fake(),
  lastUpdateTimestamp: Timestamp(Date.now()),
  stateUpdateId: 1,
  assets: [
    {
      assetId: AssetId('ETH-9'),
      balance: 0n,
      totalUSDCents: 0n,
      priceUSDCents: 1000n,
    },
    {
      assetId: AssetId.USDC,
      balance: 20n,
      totalUSDCents: 20n,
      priceUSDCents: 1000n,
    },
    {
      assetId: AssetId('LINK-7'),
      balance: -20n,
      totalUSDCents: 20n,
      priceUSDCents: 1000n,
    },
    {
      assetId: AssetId('MKR-9'),
      balance: 30n,
      totalUSDCents: 30n,
      priceUSDCents: 1000n,
    },
    {
      assetId: AssetId('BTC-10'),
      balance: 5n,
      totalUSDCents: 5n,
      priceUSDCents: 1000n,
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
  total: 121,
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
  total: 100,
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

export const TRANSACTION_FORM_PROPS: TransactionFormProps = {
  account: EthereumAddress.fake(),
  selectedAsset: AssetId('USDC-6'),
  positionId: 1234n,
  publicKey: StarkKey.fake(),
  assets: [
    {
      assetId: AssetId('USDC-6'),
      balance: 69420_654321n,
      priceUSDCents: 100n,
      totalUSDCents: 69420_65n,
    },
    {
      assetId: AssetId('ETH-9'),
      balance: 21_370000000n,
      priceUSDCents: 2839_39n,
      totalUSDCents: 60678_04n,
    },
    {
      assetId: AssetId('BTC-10'),
      balance: -5287654321n,
      priceUSDCents: 38504_34n,
      totalUSDCents: -20359_76n,
    },
    {
      assetId: AssetId('DOGE-5'),
      balance: 100_00000n,
      priceUSDCents: 13n,
      totalUSDCents: 13_12n,
    },
    {
      assetId: AssetId('SUSHI-7'),
      balance: -2_7654321n,
      priceUSDCents: 2_44n,
      totalUSDCents: 6_75n,
    },
  ],
}
