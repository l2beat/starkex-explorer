import { PedersenHash } from '@explorer/types'

export abstract class MerkleValue {
  protected abstract calculateHash(): Promise<PedersenHash>

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
