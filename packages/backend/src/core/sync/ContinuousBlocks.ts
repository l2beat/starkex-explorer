import { Hash256 } from '../../model'

export interface Block {
  readonly number: number
  readonly hash: Hash256
}

/** blocks in order and without gaps */
export class ContinuousBlocks {
  constructor(private readonly blocks: readonly Block[] = []) {
    assertContinuous(this.blocks)
  }

  get first(): Block | undefined {
    return this.blocks[0]
  }

  /**
   * @returns new continuous blocks prepended with blocks earlier than `first.number`
   *
   * - we use this to handle deep reorganizations
   */
  prependEarlier(newStart: readonly Block[]) {
    return new ContinuousBlocks(
      newStart
        .filter((x) => x.number < (this.first?.number ?? Infinity))
        .concat(this.blocks)
    )
  }

  replaceTail(newTail: readonly Block[]) {
    return new ContinuousBlocks(
      this.blocks.filter((x) => x.number < newTail[0].number).concat(newTail)
    )
  }

  concat(newBlocks: readonly Block[]) {
    return new ContinuousBlocks(this.blocks.concat(newBlocks))
  }

  take(end: number) {
    return [
      this.blocks.slice(0, end),
      new ContinuousBlocks(this.blocks.slice(end)),
    ] as const
  }
}

function assertContinuous(blocks: readonly Block[]): void {
  for (let i = 1; i < blocks.length; ++i) {
    const current = blocks[i]
    const previous = blocks[i - 1]

    if (current.number !== previous.number + 1) {
      throw new Error('Blocks are not continuous. Gap found at index: ' + i)
    }
  }
}
