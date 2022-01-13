import { PedersenHash } from '@explorer/crypto'

import { IMerkleStorage } from './IMerkleStorage'
import { MerkleValue } from './MerkleValue'

export class InMemoryMerkleStorage implements IMerkleStorage {
  private store = new Map<PedersenHash, MerkleValue>()

  async recover(hash: PedersenHash): Promise<MerkleValue> {
    const value = this.store.get(hash)
    if (!value) {
      throw new Error(`Cannot recover value for hash ${hash}`)
    }
    return value
  }

  async persist(value: MerkleValue): Promise<void> {
    const hash = await value.hash()
    this.store.set(hash, value)
  }
}
