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

export abstract class MerkleNode extends MerkleValue {
  constructor(
    private storage: IMerkleStorage,
    private leftHashOrValue: string | MerkleValue
  ) {
    super()
  }

  abstract left(): Promise<MerkleValue>
  abstract right(): Promise<MerkleValue>
}

export interface IMerkleStorage {
  get(hash: string): Promise<MerkleValue>
}
