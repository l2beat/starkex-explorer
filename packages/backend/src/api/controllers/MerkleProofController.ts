import { renderMerkleProofPage } from '@explorer/frontend'
import { UserDetails } from '@explorer/shared'

import { PageContextService } from '../../core/PageContextService'
import { StateUpdater } from '../../core/StateUpdater'
import { ControllerResult } from './ControllerResult'

export class MerkleProofController {
  constructor(
    private readonly pageContextService: PageContextService,
    private readonly stateUpdater: StateUpdater
  ) {}

  async getMerkleProofPage(
    givenUser: Partial<UserDetails>,
    positionOrVaultId: bigint
  ): Promise<ControllerResult> {
    const context = await this.pageContextService.getPageContext(givenUser)
    const merkleProof = await this.stateUpdater.generateMerkleProof(
      positionOrVaultId
    )
    const content = renderMerkleProofPage({
      context,
      positionOrVaultId,
      merkleProof: {
        rootHash: merkleProof.root,
        path: merkleProof.path,
        leaf: JSON.stringify(merkleProof.leaf.toJSON()),
      },
    })

    return { type: 'success', content }
  }
}
