import assert from 'assert'

import { BlockNumber } from '../peripherals/ethereum/types'

export class BlockRange {
  /** number of the earliest block in range */
  public readonly from: BlockNumber
  /** number of the latest block in range */
  public readonly to: BlockNumber
  private readonly hashes: ReadonlyMap<BlockNumber, string>

  constructor(
    /** a list of blocks in order from oldest to newest */
    blocks: readonly Block[]
  )
  constructor(
    /** parent block range */
    range: BlockRange,
    /** new left boundary */
    from: BlockNumber,
    /** new right boundary */
    to: BlockNumber
  )

  constructor(...args: BlockRangeConstructorArgs) {
    if (args.length === 3) {
      const [range, from, to] = args
      this.to = to
      this.from = from
      this.hashes = range.hashes

      console.log({
        to,
        from,
        range,
      })
      return
    }

    const [blocks] = args
    assert(blocks.length > 0, 'BlockRange must have at least one block')

    this.from = blocks[0].number
    this.to = blocks[blocks.length - 1].number
    this.hashes = new Map(
      blocks.map((block) => [block.number, block.hash] as const)
    )
  }

  has({
    blockNumber,
    blockHash,
  }: {
    blockNumber: BlockNumber
    blockHash: string
  }) {
    console.log(JSON.stringify({ number: blockNumber, hash: blockHash }) + ',')
    // @todo if blockNumber is far enough in the past, we want to assume
    //       every blockHash is valid
    return this.hashes.get(blockNumber) === blockHash
  }

  static from(dict: Record<BlockNumber, string>) {
    return new BlockRange(
      Object.entries(dict).map(([number, hash]) => ({
        number: Number(number),
        hash,
      }))
    )
  }
}

type Block = { number: BlockNumber; hash: string }
type BlockRangeConstructorArgs =
  | [blocks: readonly Block[]]
  | [range: BlockRange, from: number, to: number]
