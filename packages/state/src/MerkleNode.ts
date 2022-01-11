import { pedersen } from '@explorer/crypto'

import { MerkleValue } from './MerkleValue'

interface MerkleUpdate {
  id: number
  value: MerkleValue
}

export interface IMerkleStorage {
  get(hash: string): Promise<MerkleValue>
}

export class MerkleNode extends MerkleValue {
  constructor(
    private storage: IMerkleStorage,
    private leftHashOrValue: string | MerkleValue,
    private rightHashOrValue: string | MerkleValue
  ) {
    super()
  }

  async left(): Promise<MerkleValue> {
    if (typeof this.leftHashOrValue === 'string') {
      this.leftHashOrValue = await this.storage.get(this.leftHashOrValue)
    }
    return this.leftHashOrValue
  }

  async leftHash(): Promise<string> {
    if (typeof this.leftHashOrValue === 'string') {
      return this.leftHashOrValue
    }
    return this.leftHashOrValue.hash()
  }

  async right(): Promise<MerkleValue> {
    if (typeof this.rightHashOrValue === 'string') {
      this.rightHashOrValue = await this.storage.get(this.rightHashOrValue)
    }
    return this.rightHashOrValue
  }

  async rightHash(): Promise<string> {
    if (typeof this.rightHashOrValue === 'string') {
      return this.rightHashOrValue
    }
    return this.rightHashOrValue.hash()
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
    child: string | MerkleValue,
    updates: MerkleUpdate[],
    center: number,
    height: number
  ) {
    if (updates.length === 0) {
      return child
    }
    if (typeof child === 'string') {
      child = await this.storage.get(child)
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

  protected async calculateHash(): Promise<string> {
    const [leftHash, rightHash] = await Promise.all([
      this.leftHash(),
      this.rightHash(),
    ])
    return pedersen(leftHash, rightHash)
  }
}
