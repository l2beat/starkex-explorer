import assert from 'assert'
import { orderBy, range } from 'lodash'

import { BlockNumber } from '../peripherals/ethereum/types'
import { Hash256 } from './Hash256'

export class BlockRange {
  /** number of the earliest block in range */
  public readonly from: BlockNumber
  /** number of the latest block in range */
  public readonly to: BlockNumber
  private readonly hashes: ReadonlyMap<BlockNumber, Hash256>

  constructor(
    /** a unordered collection of blocks or parent block range */
    blocks: BlockRange | Iterable<BlockInRange>,
    /**
     * left boundary
     * @default max block number from `blocks`
     */
    from?: BlockNumber,
    /**
     * new right boundary
     * @default min block number from `blocks`
     */
    to?: BlockNumber
  ) {
    if (blocks instanceof BlockRange) {
      this.to = blocks.to
      this.from = blocks.from
      this.hashes = blocks.hashes
    } else {
      const blocksArray = Array.from(blocks)
      assert(blocksArray.length > 0, 'BlockRange must have at least one block')

      this.hashes = new Map(
        blocksArray.map((block) => [block.number, block.hash])
      )
      const sorted = orderBy(blocksArray, (x) => x.number)
      this.from = sorted[0].number
      this.to = sorted[sorted.length - 1].number
    }

    if (from !== undefined) this.from = from
    if (to !== undefined) this.to = to
  }

  has({
    blockNumber,
    blockHash,
  }: {
    blockNumber: BlockNumber
    blockHash: string | Hash256
  }) {
    // @todo if blockNumber is far enough in the past, we want to assume
    //       every blockHash is valid
    return this.hashes.get(blockNumber) === blockHash
  }

  static from(dict: Record<BlockNumber, Hash256>) {
    return new BlockRange(
      Object.entries(dict).map(([number, hash]) => ({
        number: Number(number),
        hash,
      }))
    )
  }

  static fake({ from, to }: { from: BlockNumber; to: BlockNumber }) {
    return new BlockRange(
      range(from, to + 1).map((i) => ({
        number: i,
        hash: Hash256.from(BigInt(i)),
      }))
    )
  }
}

export interface BlockInRange {
  number: BlockNumber
  hash: Hash256
}
