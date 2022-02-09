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
    blocks: BlockRange | Iterable<BlockInRange>,
    start?: BlockNumber,
    end?: BlockNumber
  ) {
    if (blocks instanceof BlockRange) {
      this.end = blocks.end
      this.start = blocks.start
      this.hashes = blocks.hashes
    } else {
      const blocksArray = Array.from(blocks)
      this.hashes = new Map(
        blocksArray.map((block) => [block.number, block.hash])
      )
      const blockNumbers = blocksArray.map((block) => block.number)
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
    // @todo if blockNumber is far enough in the past, we want to assume
    //       every blockHash is valid
    return this.hashes.get(blockNumber) === blockHash
  }

  includes(subset: Iterable<BlockReference>) {
    for (const x of subset) if (!this.has(x)) return false
    return true
  }
}
