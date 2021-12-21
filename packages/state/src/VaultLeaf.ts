import { pedersen } from '@explorer/crypto'

import { MerkleValue } from './types'

export class VaultLeaf extends MerkleValue {
  static EMPTY = new VaultLeaf('0', '0', 0n)

  constructor(
    readonly starkKey: string,
    readonly token: string,
    readonly balance: bigint,
    protected knownHash?: string
  ) {
    super()
  }

  protected async calculateHash() {
    return pedersen(
      await pedersen(this.starkKey, this.token),
      this.balance.toString(16)
    )
  }
}
