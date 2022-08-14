import { BigNumber } from 'ethers'

import { EthereumEvent } from './EthereumEvent'

export const LogWithdrawalPerformed = EthereumEvent<
  'LogWithdrawalPerformed',
  {
    starkKey: BigNumber
    assetType: BigNumber
    nonQuantizedAmount: BigNumber
    quantizedAmount: BigNumber
    recipient: string
  }
>(`event LogWithdrawalPerformed(
  uint256 starkKey,
  uint256 assetType,
  uint256 nonQuantizedAmount,
  uint256 quantizedAmount,
  address recipient
)`)

export const LogForcedTradeRequest = EthereumEvent<
  'LogForcedTradeRequest',
  {
    starkKeyA: BigNumber
    starkKeyB: BigNumber
    positionIdA: BigNumber
    positionIdB: BigNumber
    collateralAssetId: BigNumber
    syntheticAssetId: BigNumber
    collateralAmount: BigNumber
    syntheticAmount: BigNumber
    isABuyingSynthetic: boolean
    nonce: BigNumber
  }
>(`event LogForcedTradeRequest(
  uint256 starkKeyA,
  uint256 starkKeyB,
  uint256 positionIdA,
  uint256 positionIdB,
  uint256 collateralAssetId,
  uint256 syntheticAssetId,
  uint256 collateralAmount,
  uint256 syntheticAmount,
  bool isABuyingSynthetic,
  uint256 nonce
)`)

export const LogForcedWithdrawalRequest = EthereumEvent<
  'LogForcedWithdrawalRequest',
  { starkKey: BigNumber; positionId: BigNumber; quantizedAmount: BigNumber }
>(`event LogForcedWithdrawalRequest(
  uint256 starkKey,
  uint256 positionId,
  uint256 quantizedAmount
)`)

export const LogMemoryPagesHashes = EthereumEvent<
  'LogMemoryPagesHashes',
  { factHash: string; pagesHashes: string[] }
>('event LogMemoryPagesHashes(bytes32 factHash, bytes32[] pagesHashes)')

export const LogMemoryPageFactContinuous = EthereumEvent<
  'LogMemoryPageFactContinuous',
  { factHash: string; memoryHash: BigNumber; prod: BigNumber }
>(
  'event LogMemoryPageFactContinuous(bytes32 factHash, uint256 memoryHash, uint256 prod)'
)

export const LogStateTransitionFact = EthereumEvent<
  'LogStateTransitionFact',
  { stateTransitionFact: string }
>('event LogStateTransitionFact(bytes32 stateTransitionFact)')

export const LogUserRegistered = EthereumEvent<
  'LogUserRegistered',
  { ethKey: string; starkKey: BigNumber; sender: string }
>('event LogUserRegistered(address ethKey, uint256 starkKey, address sender)')

export const ImplementationAdded = EthereumEvent<
  'ImplementationAdded',
  { implementation: string; initializer: string; finalize: boolean }
>(
  'event ImplementationAdded(address indexed implementation, bytes initializer, bool finalize)'
)

export const Upgraded = EthereumEvent<'Upgraded', { implementation: string }>(
  'event Upgraded(address indexed implementation)'
)
