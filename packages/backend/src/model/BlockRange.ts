import assert from 'assert'
import { partition } from 'lodash'

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
    blocks: BlockRange | BlockInRange[] | ReadonlyMap<BlockNumber, Hash256>,
    start?: BlockNumber,
    end?: BlockNumber
  ) {
    let blocksStart: number | undefined
    let blocksEnd: number | undefined

    if (blocks instanceof BlockRange) {
      this.hashes = blocks.hashes
      blocksStart = blocks.start
      blocksEnd = blocks.end
    } else if (Array.isArray(blocks)) {
      if (blocks.length === 0) {
        this.hashes = new Map()
      } else {
        this.hashes = new Map(blocks.map((block) => [block.number, block.hash]))
        const blockNumbers = blocks.map((block) => block.number)
        blocksStart = Math.min(...blockNumbers)
        blocksEnd = Math.max(...blockNumbers) + 1
      }
    } else {
      if (blocks.size === 0) {
        this.hashes = new Map()
      } else {
        this.hashes = blocks
        const blockNumbers = [...blocks.keys()]
        blocksStart = Math.min(...blockNumbers)
        blocksEnd = Math.max(...blockNumbers) + 1
      }
    }

    this.start = start ?? blocksStart ?? 0
    this.end = end ?? blocksEnd ?? start ?? 0

    assert(this.end >= this.start, 'Block range cannot end before it starts')
  }

  isEmpty() {
    return this.start === this.end
  }

  get length() {
    return this.end - this.start
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

  merge(other: BlockRange | BlockInRange[]): BlockRange {
    if (!(other instanceof BlockRange)) {
      return this.merge(new BlockRange(other))
    }
    return new BlockRange(
      new Map([...this.hashes.entries(), ...other.hashes.entries()]),
      Math.min(this.start, other.start),
      Math.max(this.end, other.end)
    )
  }

  take(count: number): [taken: BlockRange, remaining: BlockRange] {
    if (count <= 0) {
      return [new BlockRange([], this.start), this]
    } else if (count >= this.length) {
      return [this, new BlockRange([], this.end)]
    }
    const [left, right] = partition(
      [...this.hashes.keys()],
      (x) => x < this.start + count
    )

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const leftBlocks = new Map(left.map((k) => [k, this.hashes.get(k)!]))
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const rightBlocks = new Map(right.map((k) => [k, this.hashes.get(k)!]))

    return [
      new BlockRange(leftBlocks, this.start, this.start + count),
      new BlockRange(rightBlocks, this.start + count, this.end),
    ]
  }
}
