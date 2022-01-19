import { pedersen, PedersenHash } from '@explorer/crypto'
import { partition } from 'lodash'

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

  async getLeaves(
    /** guaranteed to be sorted */
    indices: bigint[],
    center: bigint,
    height: bigint
  ): Promise<MerkleValue[]> {
    const [leftIndices, rightIndices] = partition(indices, (i) => i < center)
    const [leftCenter, rightCenter] = this.getCenters(center, height)
    const [leftLeaves, rightLeaves] = await Promise.all([
      this.getChildLeaves('left', leftIndices, leftCenter, height - 1n),
      this.getChildLeaves('right', rightIndices, rightCenter, height - 1n),
    ])
    return [...leftLeaves, ...rightLeaves]
  }

  async getChildLeaves(
    direction: 'left' | 'right',
    indices: bigint[],
    center: bigint,
    height: bigint
  ): Promise<MerkleValue[]> {
    if (indices.length === 0) {
      return []
    }
    const child = direction === 'left' ? await this.left() : await this.right()
    if (height === 0n) {
      if (child instanceof MerkleNode) {
        throw new Error('Tree structure corrupted')
      }
      return [child]
    }
    if (child instanceof MerkleNode) {
      return child.getLeaves(indices, center, height)
    } else {
      throw new Error('Tree structure corrupted')
    }
  }

  async update(
    updates: MerkleUpdate[],
    center: bigint,
    height: bigint
  ): Promise<[MerkleNode, MerkleValue[]]> {
    const [leftUpdates, rightUpdates] = partition(
      updates,
      (x) => x.index < center
    )
    const [leftCenter, rightCenter] = this.getCenters(center, height)
    const [[newLeft, leftNodes], [newRight, rightNodes]] = await Promise.all([
      this.updateChild(
        this.leftHashOrValue,
        leftUpdates,
        leftCenter,
        height - 1n
      ),
      this.updateChild(
        this.rightHashOrValue,
        rightUpdates,
        rightCenter,
        height - 1n
      ),
    ])
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

  private getCenters(center: bigint, height: bigint): [bigint, bigint] {
    const leftOffset = height > 1n ? 2n ** (height - 2n) : 1n
    const rightOffset = height > 1n ? 2n ** (height - 2n) : 0n
    return [center - leftOffset, center + rightOffset]
  }

  protected async calculateHash(): Promise<PedersenHash> {
    const [leftHash, rightHash] = await Promise.all([
      this.leftHash(),
      this.rightHash(),
    ])
    return pedersen(leftHash, rightHash)
  }
}
