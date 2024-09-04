import { pedersen } from '@explorer/crypto'
import { AssetHash, json, PedersenHash, StarkKey } from '@explorer/types'

import { MerkleProofPrefix, MerkleValue } from './MerkleValue'
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
  async calculateMerkleProofPrefix(): Promise<MerkleProofPrefix> {
    const proofNodes: { left: PedersenHash; right: PedersenHash }[] = []

    let hash = PedersenHash(this.starkKey.toString()) // This is only casting, not hashing
    for (const item of [
      this.assetHash.toString(),
      packBytes([{ bytes: 32, value: this.balance }]),
    ]) {
      const itemAsPedersenHash = PedersenHash(item) // This is only casting, not hashing
      proofNodes.push({ left: hash, right: itemAsPedersenHash })
      hash = await pedersen(hash, itemAsPedersenHash)
    }

    return {
      nodes: proofNodes,
      finalHash: hash,
    }
  }

  async calculateHash(): Promise<PedersenHash> {
    const MerkleProofPrefix = await this.calculateMerkleProofPrefix()
    return MerkleProofPrefix.finalHash
  }

  async calculateMerkleProofPrefix(): Promise<MerkleProofPrefix> {
    return {
      nodes: [], // TODO: implement
      finalHash: await this.hash(),
    }
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
