import { PedersenHash } from '@explorer/crypto'

import { MerkleValue } from './MerkleValue'

export interface IMerkleStorage {
  recover(hash: PedersenHash): Promise<MerkleValue>
  persist(value: MerkleValue): Promise<void>
}
