import { PedersenHash } from '@explorer/types'

import { IMerkleStorage } from './MerkleNode'
import { MerkleValue } from './MerkleValue'

export class InMemoryMerkleStorage<T extends MerkleValue = MerkleValue>
  implements IMerkleStorage<T>
{
  private store = new Map<PedersenHash, T>()

  async recover(hash: PedersenHash): Promise<T> {
    const value = this.store.get(hash)
    if (!value) {
      throw new Error(`Cannot recover value for hash ${hash}`)
    }
    return value
  }

  async persist(values: T[]): Promise<void> {
    await Promise.all(
      values.map(async (value) => {
        const hash = await value.hash()
        this.store.set(hash, value)
      })
    )
  }
}
