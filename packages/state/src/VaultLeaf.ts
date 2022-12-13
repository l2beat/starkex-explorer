import { pedersen } from '@explorer/crypto'
import { PedersenHash, StarkKey } from '@explorer/types'

import { MerkleValue } from './MerkleValue'
import { packBytes } from './packBytes'

export class VaultLeaf extends MerkleValue {
  static EMPTY = new VaultLeaf(StarkKey.ZERO, 0n, PedersenHash.ZERO)

  constructor(
    public readonly starkKey: StarkKey,
    public readonly balance: bigint,
    public readonly token: PedersenHash,
    protected knownHash?: PedersenHash
  ) {
    super()
  }

  // https://github.com/starkware-libs/starkex-for-spot-trading/blob/master/src/starkware/cairo/dex/vault_update.cairo#L33
  // Computes the hash h(key_token_hash, amount), where key_token_hash := h(stark_key, token_id)
  // For python implementation, see: 
  // https://github.com/starkware-libs/starkex-resources/blob/master/stark_ex_objects/starkware/objects/state.py#L76
  async calculateHash() {
    const key_token_hash = await pedersen(
      PedersenHash(this.starkKey.substring(2)),
      this.token
    )
    const hash = await pedersen(
      key_token_hash,
      PedersenHash(packBytes([{ bytes: 32, value: this.balance }]))
    )
    return hash
  }

  getData() {
    return {
      starkKey: this.starkKey,
      balance: this.balance,
      token: this.token,
    }
  }

  static fromJSON(
    data: ReturnType<typeof VaultLeaf.prototype.toJSON>,
    knownHash?: PedersenHash
  ) {
    return new VaultLeaf(
      data.starkKey,
      BigInt(data.balance),
      data.token,
      knownHash
    )
  }

  toJSON() {
    return {
      starkKey: this.starkKey,
      balance: this.balance.toString(),
      token: this.token,
    }
  }
}
