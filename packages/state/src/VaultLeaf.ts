import { pedersen } from '@explorer/crypto'
import { AssetHash, json, PedersenHash, StarkKey } from '@explorer/types'

import { MerkleValue } from './MerkleValue'
import { packBytes } from './packBytes'

export class VaultLeaf extends MerkleValue {
  static EMPTY = new VaultLeaf(StarkKey.ZERO, 0n, AssetHash.ZERO)

  constructor(
    public readonly starkKey: StarkKey,
    public readonly balance: bigint,
    public readonly assetHash: AssetHash,
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
      PedersenHash(this.starkKey.toString()),
      PedersenHash(this.assetHash.toString())
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
      token: this.assetHash,
    }
  }

  static fromJSON(data: json, knownHash?: PedersenHash) {
    const cast = data as unknown as ReturnType<
      typeof VaultLeaf.prototype.toJSON
    >
    return new VaultLeaf(
      StarkKey(cast.starkKey),
      BigInt(cast.balance),
      AssetHash(cast.assetHash),
      knownHash
    )
  }

  toJSON() {
    return {
      starkKey: this.starkKey.toString(),
      balance: this.balance.toString(),
      assetHash: this.assetHash.toString(),
    }
  }
}
