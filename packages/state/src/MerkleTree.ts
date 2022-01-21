import { PedersenHash } from '@explorer/crypto'

import {
  IMerkleStorage,
  MerkleNode,
  MerkleUpdate,
  NodeOrLeaf,
} from './MerkleNode'
import { MerkleValue } from './MerkleValue'

export class MerkleTree<T extends MerkleValue> {
  private maxIndex = 0n

  constructor(
    private readonly storage: IMerkleStorage<T>,
    private readonly height: bigint,
    private rootHashOrValue: PedersenHash | NodeOrLeaf<T>
  ) {
    if (height < 0) {
      throw new TypeError('Height cannot be negative')
    }
    this.maxIndex = 2n ** height - 1n
  }

  static async create<T extends MerkleValue>(
    storage: IMerkleStorage<T>,
    height: bigint,
    leaf: NodeOrLeaf<T>
  ) {
    let root = leaf
    const nodes = [leaf]
    for (let i = 0; i < height; i++) {
      root = new MerkleNode(storage, root, root)
      nodes.push(root)
    }
    await storage.persist(nodes)
    return new MerkleTree(storage, height, root)
  }

  private async root(): Promise<NodeOrLeaf<T>> {
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

  setHash(hash: PedersenHash) {
    this.rootHashOrValue = hash
  }

  async getNode(path: (0 | 1)[]): Promise<NodeOrLeaf<T>> {
    if (path.length > this.height) {
      throw new TypeError('Path too long')
    }
    let current = await this.root()
    for (const turn of path) {
      if (!(current instanceof MerkleNode)) {
        throw new Error('Tree structure corrupted')
      }
      current = turn ? await current.right() : await current.left()
    }
    return current
  }

  async getLeaf(index: bigint): Promise<T> {
    const leaves = await this.getLeaves([index])
    return leaves[0]
  }

  async getLeaves(indices: bigint[]): Promise<T[]> {
    if (indices.some((i) => i < 0n || i > this.maxIndex)) {
      throw new TypeError('Index out of bounds')
    }
    const root = await this.root()
    if (root instanceof MerkleNode) {
      const center = 2n ** (this.height - 1n)
      const sorted = [...indices].sort((a, b) => Number(a - b))
      const leaves = await root.getLeaves(sorted, center, this.height)
      const map = new Map<bigint, T>()
      for (let i = 0; i < sorted.length; i++) {
        map.set(sorted[i], leaves[i])
      }
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return indices.map((x) => map.get(x)!)
    } else {
      return [root]
    }
  }

  async update(updates: MerkleUpdate<T>[]) {
    if (updates.length === 0) {
      return
    }
    if (updates.some((x) => x.index < 0n || x.index > this.maxIndex)) {
      throw new TypeError('Index out of bounds')
    }
    const root = await this.root()
    if (root instanceof MerkleNode) {
      const center = 2n ** (this.height - 1n)
      const [newRoot, newNodes] = await root.update(
        updates,
        center,
        this.height
      )
      await this.storage.persist(newNodes)
      this.rootHashOrValue = newRoot
    } else {
      if (updates.length !== 1) {
        throw new Error('Cannot replace leaf with multiple values')
      } else {
        const newRoot = updates[0].value
        await this.storage.persist([newRoot])
        this.rootHashOrValue = newRoot
      }
    }
  }
}
