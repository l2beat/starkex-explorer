import assert from 'assert'

import { BlockNumber } from '../peripherals/ethereum/types'
import { Hash256 } from './Hash256'

export interface BlockInRange {
  number: BlockNumber
  hash: Hash256
}

interface BlockReference {
  blockNumber: BlockNumber
  blockHash: string | Hash256
}

export class BlockRange {
  /** left boundary, inclusive */
  public readonly start: BlockNumber
  /** right boundary, exclusive */
  public readonly end: BlockNumber
  private readonly hashes: ReadonlyMap<BlockNumber, Hash256>

  constructor(
    blocks: BlockRange | BlockInRange[],
    start?: BlockNumber,
    end?: BlockNumber
  ) {
    if (blocks instanceof BlockRange) {
      this.end = blocks.end
      this.start = blocks.start
      this.hashes = blocks.hashes
    } else if (blocks.length === 0) {
      this.hashes = new Map()
      this.start = 0
      this.end = 0
    } else {
      this.hashes = new Map(blocks.map((block) => [block.number, block.hash]))
      const blockNumbers = blocks.map((block) => block.number)
      this.start = Math.min(...blockNumbers)
      this.end = Math.max(...blockNumbers) + 1
    }

    if (start !== undefined) this.start = start
    if (end !== undefined) this.end = end

    assert(this.end >= this.start, 'Block range cannot end before it starts')
  }

  isEmpty() {
    return this.start === this.end
  }

  has({ blockNumber, blockHash }: BlockReference) {
    if (blockNumber < this.start || blockNumber >= this.end) {
      return false
    }
    const expectedHash = this.hashes.get(blockNumber)
    return !expectedHash || expectedHash === blockHash
  }

  hasAll(references: BlockReference[]) {
    return references.every((x) => this.has(x))
  }
}
