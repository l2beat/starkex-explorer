import { ForcedTrade, ForcedWithdrawal, OnChainData } from '@explorer/encoding'
import {
  CollateralAsset,
  ERC20Details,
  ERC721Details,
  ERC1155Details,
  ETHDetails,
} from '@explorer/shared'
import {
  AssetHash,
  AssetId,
  EthereumAddress,
  Hash256,
  PedersenHash,
  StarkKey,
  Timestamp,
} from '@explorer/types'
import { fakeHexString } from '@explorer/types/src/fake'
import { randomInt } from 'crypto'

import {
  Accepted,
  ForcedTradeOfferRecord,
} from '../peripherals/database/ForcedTradeOfferRepository'
import {
  FinalizeExitAction,
  ForcedTransactionRecord,
  Updates,
} from '../peripherals/database/ForcedTransactionRepository'
import { PreprocessedL2TransactionsStatistics } from '../peripherals/database/PreprocessedL2TransactionsStatistics'
import { StateUpdateRecord } from '../peripherals/database/StateUpdateRepository'
import { SentTransactionData } from '../peripherals/database/transactions/SentTransaction'
import { SentTransactionRecord } from '../peripherals/database/transactions/SentTransactionRepository'
import { UserTransactionData } from '../peripherals/database/transactions/UserTransaction'
import { UserTransactionRecord } from '../peripherals/database/transactions/UserTransactionRepository'
import { Record as TransactionStatusRecord } from '../peripherals/database/TransactionStatusRepository'

const MAX_SAFE_POSTGRES_INT = 2 ** 31 - 1
export function fakeInt(max = MAX_SAFE_POSTGRES_INT): number {
  return Math.floor(Math.random() * max)
}

export function fakeBigInt(max = Number.MAX_SAFE_INTEGER): bigint {
  return BigInt(fakeInt(max))
}

export function fakeBoolean(): boolean {
  return Math.random() > 0.5
}

export function fakeTimestamp(max?: number): Timestamp {
  return Timestamp(fakeInt(max))
}

export function fakeWithdrawal(
  withdrawal?: Partial<Omit<ForcedWithdrawal, 'type'>>
): ForcedWithdrawal {
  return {
    type: 'withdrawal',
    starkKey: StarkKey.fake(),
    positionId: fakeBigInt(),
    amount: fakeBigInt(),
    ...withdrawal,
  }
}

export function fakeFinalize(
  finalize?: Partial<FinalizeExitAction>
): FinalizeExitAction {
  const amount = fakeBigInt()
  return {
    starkKey: StarkKey.fake(),
    assetType: AssetId('USDC-6'),
    quantizedAmount: amount,
    nonQuantizedAmount: amount,
    recipient: EthereumAddress.fake(),
    ...finalize,
  }
}

export function fakeTrade(
  trade?: Partial<Omit<ForcedTrade, 'type'>>
): ForcedTrade {
  return {
    type: 'trade',
    collateralAmount: fakeBigInt(),
    isABuyingSynthetic: fakeBoolean(),
    nonce: fakeBigInt(),
    positionIdA: fakeBigInt(),
    positionIdB: fakeBigInt(),
    starkKeyA: StarkKey.fake(),
    starkKeyB: StarkKey.fake(),
    syntheticAmount: fakeBigInt(),
    syntheticAssetId: AssetId('USDC-6'),
    ...trade,
  }
}

export function fakeForcedUpdates(updates?: Partial<Updates>): Updates {
  return {
    forgottenAt: null,
    minedAt: null,
    revertedAt: null,
    sentAt: null,
    verified: undefined,
    finalized: undefined,
    ...updates,
  }
}

export function fakeTransactionStatus(
  record?: Partial<TransactionStatusRecord>
): TransactionStatusRecord & { sentAt: Timestamp } {
  return {
    hash: Hash256.fake(),
    forgottenAt: null,
    revertedAt: null,
    notFoundRetries: fakeInt(),
    ...record,
    sentAt: fakeTimestamp(),
    mined: undefined,
  }
}

export function fakeAccepted(accepted?: Partial<Accepted>): Accepted {
  return {
    at: fakeTimestamp(),
    nonce: fakeBigInt(),
    positionIdB: fakeBigInt(),
    premiumCost: fakeBoolean(),
    signature: fakeHexString(32),
    starkKeyB: StarkKey.fake(),
    submissionExpirationTime: Timestamp(3456000000000n),
    transactionHash: undefined,
    ...accepted,
  }
}

export function fakeOffer(
  offer?: Partial<ForcedTradeOfferRecord>
): ForcedTradeOfferRecord {
  return {
    id: fakeInt(),
    createdAt: fakeTimestamp(),
    cancelledAt: undefined,
    starkKeyA: StarkKey.fake(),
    positionIdA: fakeBigInt(),
    syntheticAssetId: AssetId('ETH-9'),
    collateralAmount: fakeBigInt(),
    syntheticAmount: fakeBigInt(),
    isABuyingSynthetic: true,
    accepted: fakeAccepted(offer?.accepted),
    ...offer,
  }
}

export function fakeInitialOffer(
  offer?: Partial<Omit<ForcedTradeOfferRecord, 'accepted'>>
) {
  return fakeOffer({ ...offer, accepted: undefined, cancelledAt: undefined })
}

export function fakeExit(
  exit?: Partial<ForcedTransactionRecord>
): ForcedTransactionRecord {
  return {
    hash: Hash256.fake(),
    data: fakeWithdrawal(),
    updates: fakeForcedUpdates(),
    lastUpdateAt: fakeTimestamp(),
    ...exit,
  }
}

export function fakeSentTransaction(
  record?: Partial<SentTransactionRecord>
): SentTransactionRecord {
  return {
    transactionHash: Hash256.fake(),
    starkKey: StarkKey.fake(),
    vaultOrPositionId: fakeBigInt(),
    data: {} as SentTransactionData,
    sentTimestamp: fakeTimestamp(),
    ...record,
  }
}

export function fakeMined(
  mined?: Partial<SentTransactionRecord['mined']>
): SentTransactionRecord['mined'] {
  return {
    timestamp: fakeTimestamp(),
    blockNumber: fakeInt(),
    reverted: false,
    ...mined,
  }
}

export function fakeUserTransaction(
  record?: Partial<UserTransactionRecord>
): UserTransactionRecord {
  return {
    id: fakeInt(),
    transactionHash: Hash256.fake(),
    starkKeyA: StarkKey.fake(),
    blockNumber: fakeInt(),
    timestamp: fakeTimestamp(),
    data: {} as UserTransactionData,
    ...record,
  }
}

export function fakeIncluded(
  included?: Partial<UserTransactionRecord['included']>
): UserTransactionRecord['included'] {
  return {
    blockNumber: fakeInt(),
    timestamp: fakeTimestamp(),
    stateUpdateId: fakeInt(),
    ...included,
  }
}

export function fakeStateUpdate(
  stateUpdate?: Partial<StateUpdateRecord>
): StateUpdateRecord {
  const batchId = fakeInt()
  return {
    id: batchId + 1,
    batchId,
    blockNumber: fakeInt(),
    stateTransitionHash: Hash256.fake(),
    rootHash: PedersenHash.fake(),
    timestamp: fakeTimestamp(),
    ...stateUpdate,
  }
}

export const fakePages = [
  '0xf01149464d55e9d6091ea8ce90e067fcdf255190c250c11c9ff223daa8f053c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008052ddcbdd431a044cf838a71d194248640210b316d7b1a568997ecad9dec962600000000000000000000000000000000000000000000000000000000000000400106637e21413d60a10ac416032cdcd6c01e78d20cc78049080dc97d13d60f29000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000062e3e4a100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000062e3e4a10000000000000000000000000000000000000000000000000000000000000018078b04cad286193af3b3e01ca0e2ee7726aeb74cf0ca3f4b89867b943d4be99c00000000000000000000000000000000000000000000000000000000000000400f3010c31764422dcb4202071950625fd63a980fb2e1f066b8baeb6615abf39b000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000062e3e4a2000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000004554482d390000000000000000000000000000000000000000000000000000000000000000000000000001c97635e700000000000000000000000000000000004254432d313000000000000000000000000000000000000000000000000000000000000000000000000002e592b7fe000000000000000000000000000000000031494e43482d37000000000000000000000000000000000000000000000000000000000000000000000000178d4fdf0000000000000000000000000000000000414156452d3800000000000000000000000000000000000000000000000000000000000000000000000000ef212d7700000000000000000000000000000000004352562d360000000000000000000000000000000000000000000000000000000000000000000000000001451eb8510000000000000000000000000000000000444f47452d3500000000000000000000000000000000000000000000000000000000000000000000000000cccccccc00000000000000000000000000000000004c494e4b2d3700000000000000000000000000000000000000000000000000000000000000000000000000a66666660000000000000000000000000000000000534f4c2d370000000000000000000000000000000000000000000000000000000000000000000000000004360418930000000000000000000000000000000000000000000000000000000062e3e4a200000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
  '000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000062e3e4a1000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000017c30a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a00000000000000000000000000000000000000000000000080000013ad3043800000000000000000000000000000000000000000000000000000000062e3e4a100000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000001b550b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b000000000000000000000000000000000000000000000000800000059de707000000000000000000000000000000000000000000000000000000000062e3e4a100000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000b090c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c0000000000000000000000000000000000000000000000008000000458e0d9c00000000000000000000000000000000000000000000000000000000062e3e4a1',
]

export const decodedFakePages: OnChainData = {
  configurationHash: Hash256(
    '0xf01149464d55e9d6091ea8ce90e067fcdf255190c250c11c9ff223daa8f053c0'
  ),
  assetConfigHashes: [],
  oldState: {
    positionRoot: PedersenHash(
      '052ddcbdd431a044cf838a71d194248640210b316d7b1a568997ecad9dec9626'
    ),
    positionHeight: 64,
    orderRoot: PedersenHash(
      '0106637e21413d60a10ac416032cdcd6c01e78d20cc78049080dc97d13d60f29'
    ),
    orderHeight: 64,
    indices: [],
    timestamp: Timestamp(1659102369000),
    oraclePrices: [],
    systemTime: Timestamp(1659102369000),
  },
  newState: {
    positionRoot: PedersenHash(
      '078b04cad286193af3b3e01ca0e2ee7726aeb74cf0ca3f4b89867b943d4be99c'
    ),
    positionHeight: 64,
    orderRoot: PedersenHash(
      '0f3010c31764422dcb4202071950625fd63a980fb2e1f066b8baeb6615abf39b'
    ),
    orderHeight: 64,
    indices: [],
    timestamp: Timestamp(1659102370000),
    oraclePrices: [
      { assetId: AssetId('ETH-9'), price: 7674934759n },
      { assetId: AssetId('BTC-10'), price: 12441532414n },
      { assetId: AssetId('1INCH-7'), price: 395136991n },
      { assetId: AssetId('AAVE-8'), price: 4011928951n },
      { assetId: AssetId('CRV-6'), price: 5454608465n },
      { assetId: AssetId('DOGE-5'), price: 3435973836n },
      { assetId: AssetId('LINK-7'), price: 2791728742n },
      { assetId: AssetId('SOL-7'), price: 18086107283n },
    ],
    systemTime: Timestamp(1659102370000),
  },
  minimumExpirationTimestamp: 1n,
  modifications: [],
  forcedActions: [],
  conditions: [],
  funding: [{ indices: [], timestamp: Timestamp(1659102369000) }],
  positions: [
    {
      positionId: 6083n,
      starkKey: StarkKey(
        '0x0a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a'
      ),
      collateralBalance: 84510000000n,
      fundingTimestamp: Timestamp(1659102369000),
      balances: [],
    },
    {
      positionId: 6997n,
      starkKey: StarkKey(
        '0x0b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b'
      ),
      collateralBalance: 24124000000n,
      fundingTimestamp: Timestamp(1659102369000),
      balances: [],
    },
    {
      positionId: 2825n,
      starkKey: StarkKey(
        '0x0c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c'
      ),
      collateralBalance: 18671000000n,
      fundingTimestamp: Timestamp(1659102369000),
      balances: [],
    },
  ],
}

export const fakeEthDetails = ETHDetails.parse({
  assetHash:
    '0x0000000000000000000000000000000000000000000000000000000000000001',
  assetTypeHash:
    '0x0000000000000000000000000000000000000000000000000000000000000001',
  type: 'ETH',
  quantum: '1',
  name: 'Ethereum',
  symbol: 'ETH',
  contractError: [],
})

export const fakeErc20Details = ERC20Details.parse({
  assetHash:
    '0x0000000000000000000000000000000000000000000000000000000000000002',
  assetTypeHash:
    '0x0000000000000000000000000000000000000000000000000000000000000002',
  type: 'ERC20',
  quantum: '1',
  contractError: [],
  address: '0x0000000000000000000000000000000000000001',
  name: 'ERC20 Token',
  symbol: 'ERC20',
  decimals: 18,
})

export const fakeErc721Details = ERC721Details.parse({
  assetHash:
    '0x0000000000000000000000000000000000000000000000000000000000000003',
  assetTypeHash:
    '0x0000000000000000000000000000000000000000000000000000000000000003',
  type: 'ERC721',
  quantum: '1',
  contractError: [],
  tokenId: '1',
  address: '0x0000000000000000000000000000000000000002',
  name: 'ERC721 Token',
  symbol: 'ERC721',
  uri: 'https://example.com/erc721/1',
})

export const fakeErc1155Details = ERC1155Details.parse({
  assetHash:
    '0x0000000000000000000000000000000000000000000000000000000000000004',
  assetTypeHash:
    '0x0000000000000000000000000000000000000000000000000000000000000004',
  type: 'ERC1155',
  quantum: '1',
  contractError: [],
  tokenId: '1',
  address: '0x0000000000000000000000000000000000000002',
  name: 'ERC1155 Token',
  symbol: 'ERC1155',
  uri: 'https://example.com/erc1155/1',
})

export const fakeCollateralAsset: CollateralAsset = {
  assetId: AssetId('USDC-6'),
  assetHash: AssetHash(
    '0x02893294412a4c8f915f75892b395ebbf6859ec246ec365c3b1f56f47c3a0a5d'
  ),
  price: 1_000_000n,
}

export const fakePreprocessedL2TransactionsStatistics = (
  count?: number
): PreprocessedL2TransactionsStatistics => {
  return {
    depositCount: count ?? randomInt(0, 100),
    withdrawalToAddressCount: count ?? randomInt(0, 100),
    forcedWithdrawalCount: count ?? randomInt(0, 100),
    tradeCount: count ?? randomInt(0, 100),
    forcedTradeCount: count ?? randomInt(0, 100),
    transferCount: count ?? randomInt(0, 100),
    conditionalTransferCount: count ?? randomInt(0, 100),
    liquidateCount: count ?? randomInt(0, 100),
    deleverageCount: count ?? randomInt(0, 100),
    fundingTickCount: count ?? randomInt(0, 100),
    oraclePricesTickCount: count ?? randomInt(0, 100),
    multiTransactionCount: count ?? randomInt(0, 100),
    replacedTransactionsCount: count ?? randomInt(0, 100),
  }
}
