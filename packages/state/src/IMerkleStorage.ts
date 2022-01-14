import { PedersenHash } from '@explorer/crypto'

import { MerkleValue } from './MerkleValue'

export interface IMerkleStorage {
  recover(hash: PedersenHash): Promise<MerkleValue>
  persist(values: MerkleValue[]): Promise<void>
}
