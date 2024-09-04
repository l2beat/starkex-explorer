import { PedersenHash } from '@explorer/types'

export interface MerkleProofPrefix {
  nodes: {
    left: PedersenHash
    right: PedersenHash
  }[]
  finalHash: PedersenHash
}

export abstract class MerkleValue {
  protected abstract calculateHash(): Promise<PedersenHash>
  abstract calculateMerkleProofPrefix(): Promise<MerkleProofPrefix> 

  protected knownHash?: PedersenHash
  protected calculatedHash?: Promise<PedersenHash>
  async hash() {
    if (this.knownHash) {
      return this.knownHash
    }
    if (!this.calculatedHash) {
      this.calculatedHash = this.calculateHash()
    }
    return this.calculatedHash
  }
}
