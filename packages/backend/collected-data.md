# Collected data

## User transactions

Users interacting with the system can send a multitude of transactions.

### registerEthAddress

Note: _Spot only_

In spot mode for the user to be able to submit forced requests and escapes they need to first register their ethereum address by signing it with their stark private key.

```
function registerEthAddress(address ethereumAddress, uint256 starkKey, bytes starkSignature)
event LogUserRegistered(address ethereumAddress, uint256 starkKey, address sender)
```

### forcedTradeRequest and freezeRequest

Note: _Perpetual only_

```
function forcedTradeRequest(
  uint256 starkKeyA,
  uint256 starkKeyB,
  uint256 positionIdA,
  uint256 positionIdB,
  uint256 collateralAssetId,
  uint256 syntheticAssetId,
  uint256 collateralAmount,
  uint256 syntheticAmount,
  bool isABuyingSynthetic,
  uint256 submissionExpirationTime,
  uint256 nonce,
  bytes signatureB,
  bool premiumCost
)
modifier notFrozen
modifier onlyKeyOwner(starkKey)
event LogForcedTradeRequest(
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
)
```

```
function freezeRequest(
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
)
modifier notFrozen
event LogFrozen()
```

### forcedWithdrawalRequest and freezeRequest

Note: _Perpetual only_

```
function forcedWithdrawalRequest(
  uint256 starkKey,
  uint256 positionId,
  uint256 quantizedAmount,
  bool premiumCost
)
modifier notFrozen
modifier onlyKeyOwner(starkKey)
event LogForcedWithdrawalRequest(
  uint256 starkKey,
  uint256 vaultId,
  uint256 quantizedAmount
)
```

```
function freezeRequest(
  uint256 starkKey,
  uint256 positionId,
  uint256 quantizedAmount
)
modifier notFrozen
event LogFrozen()
```

### fullWithdrawalRequest and freezeRequest

Note: _Spot only_

```
function fullWithdrawalRequest(uint256 starkKey, uint256 vaultId)
modifier notFrozen
modifier onlyKeyOwner(starkKey)
event LogFullWithdrawalRequest(uint256 starkKey, uint256 vaultId)
```

```
function freezeRequest(uint256 starkKey, uint256 vaultId)
modifier notFrozen
event LogFrozen()
```

### withdraw

Note: _Works for ETH and ERC20_
Note: _Works for Spot and Perpetual_

```
function withdraw(uint256 starkKey, uint256 assetType)
event LogWithdrawalPerformed(
  uint256 starkKey,
  uint256 assetType,
  uint256 nonQuantizedAmount,
  uint256 quantizedAmount,
  address recipient
)
```

### withdrawWithTokenId

Note: _Works for ERC721 and ERC1155_
Note: _Spot only_

The `withdrawNft` function is actually an alias for `withdrawWithTokenId`. Calling either functions will emit either event depending on the asset and not the function called.

```
function withdrawWithTokenId(uint256 starkKey, uint256 assetType, uint256 tokenId)
function withdrawNft(uint256 starkKey, uint256 assetType, uint256 tokenId)
event LogWithdrawalWithTokenIdPerformed(
    uint256 starkKey,
    uint256 assetType,
    uint256 tokenId,
    uint256 assetId,
    uint256 nonQuantizedAmount,
    uint256 quantizedAmount,
    address recipient
)
event LogNftWithdrawalPerformed(
    uint256 starkKey,
    uint256 assetType,
    uint256 tokenId,
    uint256 assetId,
    address recipient
)
```

### withdrawAndMint


Note: _Works for MINTABLE_ERC20 and MINTABLE_ERC721_
Note: _Spot only_

```
function withdrawAndMint(uint256 starkKey, uint256 assetType, bytes mintingBlob)
event LogMintWithdrawalPerformed(
  uint256 starkKey,
  uint256 assetType,
  uint256 nonQuantizedAmount,
  uint256 quantizedAmount,
  uint256 assetId
)
```

### Perpetual verifyEscape and escape

Note: _Perpetual only_

```
function verifyEscape(uint256[] merkleProof, uint256 nAssets, uint256[] sharedState)
event LogEscapeVerified(
  uint256 publicKey,
  int256 withdrawalAmount,
  bytes32 sharedStateHash,
  uint256 positionId
)
```

```
function escape(uint256 starkKey, uint256 positionId, uint256 quantizedAmount)
```

There are events here, but none unique to `escape`.

### Spot verifyEscape and escape

Note: _Spot only_

```
function verifyEscape(uint256[] calldata escapeProof)
```

No events are present for this `verifyEscape`.

```
function escape(
  uint256 starkKey,
  uint256 vaultId,
  uint256 assetId,
  uint256 quantizedAmount
)
```

There are events here, but none unique to `escape`.
