import { renderMerkleProofPage } from '@explorer/frontend'
import { UserDetails } from '@explorer/shared'
import { PositionLeaf, VaultLeaf } from '@explorer/state'

import { StateUpdater } from '../../core/StateUpdater'
import { UserService } from '../../core/UserService'
import { ControllerResult } from './ControllerResult'

export class MerkleProofController {
  constructor(
    private readonly userService: UserService,
    private readonly stateUpdater: StateUpdater<PositionLeaf | VaultLeaf>,
    private readonly tradingMode: 'perpetual' | 'spot'
  ) {}

  async getMerkleProofPage(
    givenUser: Partial<UserDetails>,
    positionOrVaultId: bigint
  ): Promise<ControllerResult> {
    const user = await this.userService.getUserDetails(givenUser)
    const merkleProof = await this.stateUpdater.generateMerkleProof(
      positionOrVaultId
    )
    const content = renderMerkleProofPage({
      positionOrVaultId,
      user,
      tradingMode: this.tradingMode,
      merkleProof: {
        rootHash: merkleProof.root,
        path: merkleProof.path,
        leaf: JSON.stringify(merkleProof.leaf.toJSON()),
      },
    })

    return { type: 'success', content }
  }
}
