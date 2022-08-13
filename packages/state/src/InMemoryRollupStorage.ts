import { PedersenHash } from '@explorer/types'

import { InMemoryMerkleStorage } from './InMemoryMerkleStorage'
import { Position } from './Position'
import { IRollupStateStorage, RollupParameters } from './RollupState'

export class InMemoryRollupStorage
  extends InMemoryMerkleStorage<Position>
  implements IRollupStateStorage
{
  private parameters = new Map<PedersenHash, RollupParameters>()

  // eslint-disable-next-line @typescript-eslint/require-await
  async getParameters(rootHash: PedersenHash): Promise<RollupParameters> {
    const values = this.parameters.get(rootHash)
    if (!values) {
      throw new Error(`Cannot recover parameters for hash ${rootHash.toString()}`)
    }
    return values
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async setParameters(rootHash: PedersenHash, values: RollupParameters) {
    this.parameters.set(rootHash, values)
  }
}
