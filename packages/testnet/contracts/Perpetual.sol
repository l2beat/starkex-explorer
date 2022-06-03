// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

contract Perpetual {
    event LogUserRegistered(address ethKey, uint256 starkKey, address sender);

    event LogStateTransitionFact(bytes32 stateTransitionFact);

    event LogForcedWithdrawalRequest(
        uint256 starkKey,
        uint256 positionId,
        uint256 quantizedAmount
    );

    event LogForcedTradeRequest(
        uint256 starkKeyA,
        uint256 starkKeyB,
        uint256 positionIdA,
        uint256 positionIdB,
        uint256 collateralAssetId,
        uint256 syntheticAssetId,
        uint256 collateralAmount,
        uint256 syntheticAmount,
        bool aIsBuyingSynthetic,
        uint256 nonce
    );

    function registerUser(address ethKey, uint256 starkKey) external {
        emit LogUserRegistered(ethKey, starkKey, msg.sender);
    }

    function emitLogStateTransitionFact(bytes32 stateTransitionFact) external {
        emit LogStateTransitionFact(stateTransitionFact);
    }

    function forcedWithdrawalRequest(
        uint256 starkKey,
        uint256 positionId,
        uint256 quantizedAmount,
        bool
    ) external {
        emit LogForcedWithdrawalRequest(starkKey, positionId, quantizedAmount);
    }

    function forcedTradeRequest(
        uint256 starkKeyA,
        uint256 starkKeyB,
        uint256 positionIdA,
        uint256 positionIdB,
        uint256 collateralAssetId,
        uint256 syntheticAssetId,
        uint256 collateralAmount,
        uint256 syntheticAmount,
        bool aIsBuyingSynthetic,
        uint256,
        uint256 nonce,
        bytes calldata,
        bool
    ) external {
        emit LogForcedTradeRequest(
            starkKeyA,
            starkKeyB,
            positionIdA,
            positionIdB,
            collateralAssetId,
            syntheticAssetId,
            collateralAmount,
            syntheticAmount,
            aIsBuyingSynthetic,
            nonce
        );
    }
}
