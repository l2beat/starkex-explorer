import { PedersenHash, StarkKey } from '@explorer/types'

import {
  IMerkleStorage,
  MerkleNode,
  MerkleUpdate,
  NodeOrLeaf,
} from './MerkleNode'
import { MerkleValue } from './MerkleValue'
import { PositionLeaf } from './PositionLeaf'
import { VaultLeaf } from './VaultLeaf'

export interface MerkleProof<T extends MerkleValue> {
  root: PedersenHash
  path: {
    left: PedersenHash
    right: PedersenHash
  }[]
  leafPrefixLength: number
  leafIndex: bigint
  perpetualAssetCount: number
  leaf: T
  starkKey: StarkKey
}

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
    const [leaf] = await this.getLeaves([index])
    if (!leaf) {
      throw new Error(`No leaf at index ${index}`)
    }
    return leaf
  }

  // For reference see: https://github.com/starkware-libs/starkex-contracts/blob/master/scalable-dex/contracts/src/components/PedersenMerkleVerifier.sol
  async getMerkleProofForLeaf(index: bigint): Promise<MerkleProof<T>> {
    if (index < 0n || index > this.maxIndex) {
      throw new TypeError('Index out of bounds')
    }
    const root = await this.root()

    const path: { left: PedersenHash; right: PedersenHash }[] = []
    let node = root
    let height = this.height
    let center = 2n ** (height - 1n)
    while (node instanceof MerkleNode) {
      path.unshift({
        left: await node.leftHash(),
        right: await node.rightHash(),
      })
      const centers = node.getCenters(center, height)
      if (index < center) {
        node = await node.left()
        center = centers[0]
      } else {
        node = await node.right()
        center = centers[1]
      }
      height -= 1n
    }

    // This is a special solution in Perpetual StarkEx, where the leaf values
    // and intermediate hashes are prefixed to the merkle proof (in practice
    // making the tree higher)
    let leafPrefixLength = 0
    let perpetualAssetCount = 0
    let starkKey: StarkKey
    if (node instanceof PositionLeaf) {
      const prefix = await node.calculateMerkleProofPrefix()
      path.unshift(...prefix.nodes)
      leafPrefixLength = prefix.nodes.length
      perpetualAssetCount = node.assets.length
      starkKey = node.starkKey
    }
    else if (node instanceof VaultLeaf) {
      starkKey = node.starkKey
    }
    else {
      throw new Error('Unknown leaf type, this should never happen')
    }

    return {
      root: await this.hash(),
      path,
      leafPrefixLength,
      leaf: node,
      leafIndex: index,
      perpetualAssetCount,
      starkKey
    }
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
        const [index, leaf] = [sorted[i], leaves[i]]
        if (index !== undefined && leaf !== undefined) {
          map.set(index, leaf)
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return indices.map((x) => map.get(x)!)
    } else {
      return [root]
    }
  }

  async update(updates: MerkleUpdate<T>[]) {
    if (updates.length === 0) {
      return this
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
      return new MerkleTree(this.storage, this.height, newRoot)
    } else {
      if (updates.length !== 1) {
        throw new Error('Cannot replace leaf with multiple values')
      } else {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const newRoot = updates[0]!.value
        await this.storage.persist([newRoot])
        return new MerkleTree(this.storage, this.height, newRoot)
      }
    }
  }
}
