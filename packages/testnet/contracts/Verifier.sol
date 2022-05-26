// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

contract Verifier {
    event LogMemoryPagesHashes(bytes32 factHash, bytes32[] pagesHashes);

    function emitLogMemoryPagesHashes(
        bytes32 factHash,
        bytes32[] calldata pagesHashes
    ) public {
        emit LogMemoryPagesHashes(factHash, pagesHashes);
    }
}
