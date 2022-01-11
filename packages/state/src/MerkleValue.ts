export abstract class MerkleValue {
  protected abstract calculateHash(): Promise<string>

  protected knownHash?: string
  protected calculatedHash?: Promise<string>
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
