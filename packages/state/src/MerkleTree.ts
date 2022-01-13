import { PedersenHash } from '@explorer/crypto'

import { IMerkleStorage } from './IMerkleStorage'
import { MerkleNode } from './MerkleNode'
import { MerkleUpdate } from './MerkleUpdate'
import { MerkleValue } from './MerkleValue'

export class MerkleTree {
  constructor(
    private storage: IMerkleStorage,
    private height: number,
    private rootHashOrValue: PedersenHash | MerkleValue
  ) {}

  static create(storage: IMerkleStorage, height: number, leaf: MerkleValue) {
    let root = leaf
    for (let i = 0; i < height; i++) {
      root = new MerkleNode(storage, root, root)
    }
    return new MerkleTree(storage, height, root)
  }

  private async root(): Promise<MerkleValue> {
    if (!(this.rootHashOrValue instanceof MerkleValue)) {
      this.rootHashOrValue = await this.storage.recover(this.rootHashOrValue)
    }
    return this.rootHashOrValue
  }

  async hash(): Promise<PedersenHash> {
    if (this.rootHashOrValue instanceof MerkleValue) {
      return this.rootHashOrValue.hash()
    }
    return this.rootHashOrValue
  }

  async update(updates: MerkleUpdate[]) {
    if (updates.length === 0) {
      return
    }
    const root = await this.root()
    if (root instanceof MerkleNode) {
      const center = 2 ** (this.height - 2)
      this.rootHashOrValue = await root.update(updates, center, this.height - 1)
    } else {
      if (updates.length !== 1) {
        throw new Error('Cannot replace leaf with multiple values')
      } else {
        this.rootHashOrValue = updates[0].value
      }
    }
  }
}
