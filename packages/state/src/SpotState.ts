import { PedersenHash } from '@explorer/types'

import { NodeOrLeaf } from './MerkleNode'
import { MerkleTree } from './MerkleTree'
import { VaultLeaf } from './VaultLeaf'

export interface ISpotStateStorage {
  recover(hash: PedersenHash): Promise<NodeOrLeaf<VaultLeaf>>
  persist(values: NodeOrLeaf<VaultLeaf>[]): Promise<void>
}

export class SpotState {
  constructor(
    private readonly storage: ISpotStateStorage,
    public readonly positionTree: MerkleTree<VaultLeaf>
  ) {}

  static recover(
    storage: ISpotStateStorage,
    rootHash: PedersenHash,
    height: bigint
  ) {
    return new SpotState(storage, new MerkleTree(storage, height, rootHash))
  }

  static async empty(storage: ISpotStateStorage, height: bigint) {
    return new SpotState(
      storage,
      await MerkleTree.create(storage, height, VaultLeaf.EMPTY)
    )
  }

  async update(newPositions: { index: bigint; value: VaultLeaf }[]) {
    const positions = await this.positionTree.update(newPositions)
    return new SpotState(this.storage, positions)
  }
}
