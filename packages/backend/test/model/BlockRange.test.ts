import { expect } from 'earljs'

import { Hash256 } from '../../src/model'
import { BlockRange } from '../../src/model/BlockRange'

describe(BlockRange.name, () => {
  describe('constructor', () => {
    it('can crate a zero blocks block range', () => {
      const blockRange = new BlockRange([])
      expect(blockRange.start).toEqual(0)
      expect(blockRange.end).toEqual(0)
    })

    it('can crate a zero blocks block range with a given start', () => {
      const blockRange = new BlockRange([], 1000)
      expect(blockRange.start).toEqual(1000)
      expect(blockRange.end).toEqual(1000)
    })

    it('can crate a block range with a given span', () => {
      const blockRange = new BlockRange([], 1000, 1500)
      expect(blockRange.start).toEqual(1000)
      expect(blockRange.end).toEqual(1500)
    })

    it('can crate a block range from a map', () => {
      const rangeA = new BlockRange([
        { number: 10, hash: Hash256.fake('10') },
        { number: 11, hash: Hash256.fake('11') },
        { number: 13, hash: Hash256.fake('13') },
      ])
      const rangeB = new BlockRange(new Map([
        [10, Hash256.fake('10')],
        [11, Hash256.fake('11')],
        [13, Hash256.fake('13')],
      ]))
      expect(rangeA).toEqual(rangeB)
    })

    it('can crate a block range from a block range', () => {
      const rangeA = new BlockRange([
        { number: 10, hash: Hash256.fake('10') },
        { number: 11, hash: Hash256.fake('11') },
        { number: 13, hash: Hash256.fake('13') },
      ])
      const rangeB = new BlockRange(rangeA)
      expect(rangeA).toEqual(rangeB)
    })

    it('correctly sets start and end', () => {
      const blockRange = new BlockRange([
        { number: 10, hash: Hash256.fake('10') },
        { number: 11, hash: Hash256.fake('11') },
        { number: 13, hash: Hash256.fake('13') },
      ])
      expect(blockRange.start).toEqual(10)
      expect(blockRange.end).toEqual(14)
    })

    it('can override start', () => {
      const blockRange = new BlockRange([
        { number: 10, hash: Hash256.fake('10') },
        { number: 11, hash: Hash256.fake('11') },
        { number: 13, hash: Hash256.fake('13') },
      ], 5)
      expect(blockRange.start).toEqual(5)
      expect(blockRange.end).toEqual(14)
    })

    it('can override start and end', () => {
      const blockRange = new BlockRange([
        { number: 10, hash: Hash256.fake('10') },
        { number: 11, hash: Hash256.fake('11') },
        { number: 13, hash: Hash256.fake('13') },
      ], 5, 20)
      expect(blockRange.start).toEqual(5)
      expect(blockRange.end).toEqual(20)
    })
  })

  describe(BlockRange.prototype.has.name, () => {
    const blockRange = new BlockRange(
      [
        { number: 10, hash: Hash256.fake('10') },
        { number: 11, hash: Hash256.fake('11') },
        { number: 13, hash: Hash256.fake('13') },
      ],
      5,
      15
    )

    it('returns true for a matching number and hash', () => {
      expect(
        blockRange.has({ blockNumber: 11, blockHash: Hash256.fake('11') })
      ).toEqual(true)
    })

    it('returns false for a matching number but a different hash', () => {
      expect(
        blockRange.has({ blockNumber: 11, blockHash: Hash256.fake('22') })
      ).toEqual(false)
    })

    it('returns true for a block inside range of unknown hash', () => {
      expect(
        blockRange.has({ blockNumber: 9, blockHash: Hash256.fake('abc') })
      ).toEqual(true)
    })

    it('returns true for a block outside range', () => {
      expect(
        blockRange.has({ blockNumber: 100, blockHash: Hash256.fake('abc') })
      ).toEqual(false)
    })
  })

  describe(BlockRange.prototype.hasAll.name, () => {
    const blockRange = new BlockRange(
      [
        { number: 10, hash: Hash256.fake('10') },
        { number: 11, hash: Hash256.fake('11') },
        { number: 13, hash: Hash256.fake('13') },
      ],
      5,
      15
    )

    it('returns true when all items match', () => {
      expect(
        blockRange.hasAll([
          { blockNumber: 9, blockHash: Hash256.fake('abc') },
          { blockNumber: 11, blockHash: Hash256.fake('11') },
        ])
      ).toEqual(true)
    })

    it('returns false when some items do not match', () => {
      expect(
        blockRange.hasAll([
          { blockNumber: 9, blockHash: Hash256.fake('abc') },
          { blockNumber: 10, blockHash: Hash256.fake('22') },
          { blockNumber: 11, blockHash: Hash256.fake('11') },
        ])
      ).toEqual(false)
    })
  })

  describe(BlockRange.prototype.isEmpty.name, () => {
    it('returns false when some blocks are known', () => {
      const blockRange = new BlockRange([
        { number: 10, hash: Hash256.fake('10') },
        { number: 11, hash: Hash256.fake('11') },
        { number: 13, hash: Hash256.fake('13') },
      ])
      expect(blockRange.isEmpty()).toEqual(false)
    })

    it('returns false when the range covers some blocks', () => {
      const blockRange = new BlockRange([], 5, 10)
      expect(blockRange.isEmpty()).toEqual(false)
    })

    it('returns true when the range covers no blocks', () => {
      const blockRange = new BlockRange([])
      expect(blockRange.isEmpty()).toEqual(true)
    })
  })

  describe(BlockRange.prototype.merge.name, () => {
    it('merges two block ranges', () => {
      const first = new BlockRange([
        { number: 10, hash: Hash256.fake('10') },
        { number: 11, hash: Hash256.fake('11') },
      ])
      const second = new BlockRange([
        { number: 11, hash: Hash256.fake('11') },
        { number: 12, hash: Hash256.fake('12') },
        { number: 13, hash: Hash256.fake('13') },
      ])
      const result = first.merge(second)
      expect(result.start).toEqual(10)
      expect(result.end).toEqual(14)
      expect([
        result.has({ blockNumber: 10, blockHash: Hash256.fake('10') }),
        result.has({ blockNumber: 10, blockHash: Hash256.fake('abc') }),
        result.has({ blockNumber: 13, blockHash: Hash256.fake('13') }),
        result.has({ blockNumber: 13, blockHash: Hash256.fake('abc') }),
      ]).toEqual([true, false, true, false])
    })
  })

  describe(BlockRange.prototype.take.name, () => {
    const range = new BlockRange([
      { number: 10, hash: Hash256.fake('10') },
      { number: 11, hash: Hash256.fake('11') },
      { number: 12, hash: Hash256.fake('12') },
    ])

    it('can take zero items', () => {
      const [taken, remaining] = range.take(0)
      expect(taken).toEqual(new BlockRange([], 10, 10))
      expect(remaining).toEqual(range)
    })

    it('can take all items', () => {
      const [taken, remaining] = range.take(3)
      expect(taken).toEqual(range)
      expect(remaining).toEqual(new BlockRange([], 13, 13))
    })

    it('cannot take more than all items', () => {
      const [taken, remaining] = range.take(1000)
      expect(taken).toEqual(range)
      expect(remaining).toEqual(new BlockRange([], 13, 13))
    })

    it('can take some items', () => {
      const [taken, remaining] = range.take(2)
      expect(taken).toEqual(
        new BlockRange([
          { number: 10, hash: Hash256.fake('10') },
          { number: 11, hash: Hash256.fake('11') },
        ])
      )
      expect(remaining).toEqual(
        new BlockRange([{ number: 12, hash: Hash256.fake('12') }])
      )
    })
  })
})
