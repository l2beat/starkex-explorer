import { pedersen, PedersenHash } from '@explorer/crypto'

import { IMerkleStorage } from './IMerkleStorage'
import { MerkleUpdate } from './MerkleUpdate'
import { MerkleValue } from './MerkleValue'

export class MerkleNode extends MerkleValue {
  constructor(
    private storage: IMerkleStorage,
    private leftHashOrValue: PedersenHash | MerkleValue,
    private rightHashOrValue: PedersenHash | MerkleValue
  ) {
    super()
  }

  async left(): Promise<MerkleValue> {
    if (!(this.leftHashOrValue instanceof MerkleValue)) {
      this.leftHashOrValue = await this.storage.recover(this.leftHashOrValue)
    }
    return this.leftHashOrValue
  }

  async leftHash(): Promise<PedersenHash> {
    if (this.leftHashOrValue instanceof MerkleValue) {
      return this.leftHashOrValue.hash()
    }
    return this.leftHashOrValue
  }

  async right(): Promise<MerkleValue> {
    if (!(this.rightHashOrValue instanceof MerkleValue)) {
      this.rightHashOrValue = await this.storage.recover(this.rightHashOrValue)
    }
    return this.rightHashOrValue
  }

  async rightHash(): Promise<PedersenHash> {
    if (this.rightHashOrValue instanceof MerkleValue) {
      return this.rightHashOrValue.hash()
    }
    return this.rightHashOrValue
  }

  async update(
    updates: MerkleUpdate[],
    center: number,
    height: number
  ): Promise<MerkleNode> {
    const leftUpdates = updates.filter((x) => x.id < center)
    const rightUpdates = updates.filter((x) => x.id >= center)
    const offset = 2 ** (height - 2)
    const newLeft = await this.updateChild(
      this.leftHashOrValue,
      leftUpdates,
      center - offset,
      height - 1
    )
    const newRight = await this.updateChild(
      this.rightHashOrValue,
      rightUpdates,
      center + offset,
      height - 1
    )
    return new MerkleNode(this.storage, newLeft, newRight)
  }

  private async updateChild(
    child: PedersenHash | MerkleValue,
    updates: MerkleUpdate[],
    center: number,
    height: number
  ) {
    if (updates.length === 0) {
      return child
    }
    if (typeof child === 'string') {
      child = await this.storage.recover(child)
    }
    if (child instanceof MerkleNode) {
      return child.update(updates, center, height)
    } else {
      if (updates.length !== 1) {
        throw new Error('Cannot replace leaf with multiple values')
      } else {
        return updates[0].value
      }
    }
  }

  protected async calculateHash(): Promise<PedersenHash> {
    const [leftHash, rightHash] = await Promise.all([
      this.leftHash(),
      this.rightHash(),
    ])
    return pedersen(leftHash, rightHash)
  }
}
