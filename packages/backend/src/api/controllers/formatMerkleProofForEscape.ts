import { MerkleProof, MerkleValue } from '@explorer/state'

export function formatMerkleProofForEscape(
  proof: MerkleProof<MerkleValue>
): bigint[] {
  // See the format of the proof here:
  // https://vscode.dev/github/starkware-libs/starkex-contracts/blob/master/scalable-dex/contracts/src/components/PedersenMerkleVerifier.sol#L25
  // Important: for perpetuals, there are values additionally appended to the proof, see:
  // https://vscode.dev/github/starkware-libs/starkex-contracts/blob/master/scalable-dex/contracts/src/perpetual/components/PerpetualEscapeVerifier.sol#L137
  const result: bigint[] = []

  for (const step of proof.path) {
    // +-------------------------------+---------------------------+-----------+
    // | left_node_n (252)             | right_node_n (252)        | zeros (8) |
    // +-------------------------------+-----------+---------------+-----------+
    const leftBigInt = BigInt('0x' + step.left.toString())
    const rightBigInt = BigInt('0x' + step.right.toString())
    const leftTrimmed = leftBigInt & ((1n << 252n) - 1n)
    const rightTrimmed = rightBigInt & ((1n << 252n) - 1n)
    const entry = ((leftTrimmed << 252n) | rightTrimmed) << 8n
    // Split into 2 256-bit chunks and add to result
    result.push(entry >> 256n)
    result.push(entry & ((1n << 256n) - 1n))
  }

  // Add root and leaf index
  // +-------------------------------+-----------+---------------+-----------+
  // | root (252)                    | zeros (4) | nodeIdx (248) | zeros (8) |
  // +-------------------------------+-----------+---------------+-----------+
  const rootBigInt = BigInt('0x' + proof.root.toString())
  const rootTrimmed = rootBigInt & ((1n << 252n) - 1n)
  // index needs to be adjusted due to increased tree height
  // stemming from including the leaf values in the proof
  const adjustedIndex = proof.leafIndex << BigInt(proof.leafPrefixLength)
  const indexTrimmed = adjustedIndex & ((1n << 248n) - 1n)
  const entry = (((rootTrimmed << 4n) << 248n) | indexTrimmed) << 8n
  // Split into 2 256-bit chunks and add to result
  result.push(entry >> 256n)
  result.push(entry & ((1n << 256n) - 1n))

  return result
}
