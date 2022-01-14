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

  async get(
    index: bigint,
    center: bigint,
    height: bigint
  ): Promise<MerkleValue> {
    const child = index < center ? await this.left() : await this.right()
    if (height === 1n) {
      if (child instanceof MerkleNode) {
        throw new Error('Tree structure corrupted')
      }
      return child
    }
    const offset = height > 1n ? 2n ** (height - 2n) : index < center ? 1n : 0n
    if (child instanceof MerkleNode) {
      return child.get(
        index,
        index < center ? center - offset : center + offset,
        height - 1n
      )
    } else {
      throw new Error('Tree structure corrupted')
    }
  }

  async update(
    updates: MerkleUpdate[],
    center: bigint,
    height: bigint
  ): Promise<[MerkleNode, MerkleValue[]]> {
    const leftUpdates = updates.filter((x) => x.index < center)
    const rightUpdates = updates.filter((x) => x.index >= center)
    const offset = height > 1n ? 2n ** (height - 2n) : 0n
    const [newLeft, leftNodes] = await this.updateChild(
      this.leftHashOrValue,
      leftUpdates,
      height > 1n ? center - offset : center - 1n,
      height - 1n
    )
    const [newRight, rightNodes] = await this.updateChild(
      this.rightHashOrValue,
      rightUpdates,
      center + offset,
      height - 1n
    )
    const newNode = new MerkleNode(this.storage, newLeft, newRight)
    return [newNode, [...leftNodes, ...rightNodes, newNode]]
  }

  private async updateChild(
    child: PedersenHash | MerkleValue,
    updates: MerkleUpdate[],
    center: bigint,
    height: bigint
  ): Promise<[PedersenHash | MerkleValue, MerkleValue[]]> {
    if (updates.length === 0) {
      return [child, []]
    }
    if (!(child instanceof MerkleValue)) {
      child = await this.storage.recover(child)
    }
    if (height === 0n) {
      if (child instanceof MerkleNode) {
        throw new Error('Tree structure corrupted')
      }
      const value = updates[updates.length - 1].value
      return [value, [value]]
    }
    if (child instanceof MerkleNode) {
      return child.update(updates, center, height)
    } else {
      throw new Error('Tree structure corrupted')
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
