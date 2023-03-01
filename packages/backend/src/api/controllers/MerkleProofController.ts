import { PositionLeaf, VaultLeaf } from '@explorer/state'

import { StateUpdater } from '../../core/StateUpdater'
import { ControllerResult } from './ControllerResult'

export class MerkleProofController {
  constructor(
    public stateUpdater: StateUpdater<PositionLeaf | VaultLeaf>,
    private readonly tradingMode: 'perpetual' | 'spot'
  ) {}

  async getMerkleProofPage(
    positionOrVaultId: bigint
  ): Promise<ControllerResult> {
    const merkleProof = await this.stateUpdater.generateMerkleProof(
      positionOrVaultId
    )
    return {
      type: 'success',
      content: `Merkle proof: <pre>${JSON.stringify(
        merkleProof,
        null,
        2
      )}</pre>`,
    }
  }
}
