import { BigNumber } from 'ethers'

import { EthereumEvent } from './EthereumEvent'

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

export const LogUpdateState = EthereumEvent<
  'LogUpdateState',
  { sequenceNumber: BigNumber; batchId: BigNumber }
>('event LogUpdateState(uint256 sequenceNumber, uint256 batchId)')

export const LogRootUpdate = EthereumEvent<
  'LogRootUpdate',
  {
    sequenceNumber: BigNumber
    batchId: BigNumber
    validiumVaultRoot: BigNumber
    rollupVaultRoot: BigNumber
    orderRoot: BigNumber
  }
>(
  'event LogRootUpdate(uint256 sequenceNumber, uint256 batchId, uint256 validiumVaultRoot, uint256 rollupVaultRoot, uint256 orderRoot)'
)

export const LogTokenRegistered = EthereumEvent<
  'LogTokenRegistered',
  {
    assetType: BigNumber
    assetInfo: string
    quantum: BigNumber
  }
>(
  'event LogTokenRegistered(uint256 assetType, bytes assetInfo, uint256 quantum)'
)

export const LogDeposit = EthereumEvent<
  'LogDeposit',
  {
    depositorEthKey: string
    starkKey: BigNumber
    vaultId: BigNumber
    assetType: BigNumber
    nonQuantizedAmount: BigNumber
    quantizedAmount: BigNumber
  }
>(`event LogDeposit(
  address depositorEthKey,
  uint256 starkKey,
  uint256 vaultId,
  uint256 assetType,
  uint256 nonQuantizedAmount,
  uint256 quantizedAmount
)`)

export const LogDepositWithTokenId = EthereumEvent<
  'LogDepositWithTokenId',
  {
    depositorEthKey: string
    starkKey: BigNumber
    vaultId: BigNumber
    assetType: BigNumber
    tokenId: BigNumber
    assetId: BigNumber
    nonQuantizedAmount: BigNumber
    quantizedAmount: BigNumber
  }
>(`event LogDepositWithTokenId(
  address depositorEthKey,
  uint256 starkKey,
  uint256 vaultId,
  uint256 assetType,
  uint256 tokenId,
  uint256 assetId,
  uint256 nonQuantizedAmount,
  uint256 quantizedAmount
)`)

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

// #region withdrawable_assets
// These are events modifying the `pendingWithdrawals` map in solidity contracts

// - events *increasing* the amount of withdrawable assets:
// https://github.com/starkware-libs/starkex-contracts/blob/210bd5f6bcb6977211677821fe925140859a0f6e/scalable-dex/contracts/src/interactions/AcceptModifications.sol#L55

export const LogWithdrawalAllowed = EthereumEvent<
  'LogWithdrawalAllowed',
  {
    starkKey: BigNumber
    assetType: BigNumber
    nonQuantizedAmount: BigNumber
    quantizedAmount: BigNumber
  }
>(`event LogWithdrawalAllowed(
  uint256 starkKey,
  uint256 assetType,
  uint256 nonQuantizedAmount,
  uint256 quantizedAmount
)`)

export const LogMintableWithdrawalAllowed = EthereumEvent<
  'LogMintableWithdrawalAllowed',
  {
    starkKey: BigNumber
    assetId: BigNumber
    quantizedAmount: BigNumber
  }
>(`event LogMintableWithdrawalAllowed(
  uint256 starkKey, 
  uint256 assetId, 
  uint256 quantizedAmount
)`)

export const LogAssetWithdrawalAllowed = EthereumEvent<
  'LogAssetWithdrawalAllowed',
  {
    starkKey: BigNumber
    assetId: BigNumber
    quantizedAmount: BigNumber
  }
>(`event LogAssetWithdrawalAllowed(
  uint256 starkKey, 
  uint256 assetId, 
  uint256 quantizedAmount
)`)

// - events *decreasing* the amount of withdrawable assets:
// https://github.com/starkware-libs/starkex-contracts/blob/210bd5f6bcb6977211677821fe925140859a0f6e/scalable-dex/contracts/src/interactions/Withdrawals.sol#L108
// https://github.com/starkware-libs/starkex-contracts/blob/210bd5f6bcb6977211677821fe925140859a0f6e/scalable-dex/contracts/src/interactions/Withdrawals.sol#L133
// https://github.com/starkware-libs/starkex-contracts/blob/210bd5f6bcb6977211677821fe925140859a0f6e/scalable-dex/contracts/src/interactions/Withdrawals.sol#L174

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

export const LogWithdrawalWithTokenIdPerformed = EthereumEvent<
  'LogWithdrawalWithTokenIdPerformed',
  {
    starkKey: BigNumber
    assetType: BigNumber
    tokenId: BigNumber
    assetId: BigNumber
    nonQuantizedAmount: BigNumber
    quantizedAmount: BigNumber
    recipient: string
  }
>(`event LogWithdrawalWithTokenIdPerformed(
  uint256 starkKey,
  uint256 assetType,
  uint256 tokenId,
  uint256 assetId,
  uint256 nonQuantizedAmount,
  uint256 quantizedAmount,
  address recipient
)`)

export const LogMintWithdrawalPerformed = EthereumEvent<
  'LogMintWithdrawalPerformed',
  {
    starkKey: BigNumber
    assetType: BigNumber
    nonQuantizedAmount: BigNumber
    quantizedAmount: BigNumber
    assetId: BigNumber
  }
>(`event LogMintWithdrawalPerformed(
  uint256 starkKey,
  uint256 assetType,
  uint256 nonQuantizedAmount,
  uint256 quantizedAmount,
  uint256 assetId
)`)

// #endregion withdrawable_assets
