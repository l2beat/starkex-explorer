// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

contract Registry {
    event LogMemoryPageFactContinuous(bytes32, uint256 memoryHash, uint256);

    function registerContinuousMemoryPage(
        uint256,
        uint256[] calldata values,
        uint256,
        uint256,
        uint256
    ) public {
        uint256 memoryHash = uint256(keccak256(abi.encodePacked(values)));
        emit LogMemoryPageFactContinuous(bytes32(0), memoryHash, 0);
    }
}
