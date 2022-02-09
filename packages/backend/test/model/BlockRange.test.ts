import { expect } from 'earljs'

import { Hash256 } from '../../src/model'
import { BlockRange } from '../../src/model/BlockRange'

describe(BlockRange.name, () => {
  it('has .start and .end properties', () => {
    const blockRange = new BlockRange([
      { number: 1, hash: Hash256.fake() },
      { number: 2, hash: Hash256.fake() },
      { number: 3, hash: Hash256.fake() },
    ])

    expect(blockRange.start).toEqual(1)
    expect(blockRange.end).toEqual(4)
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
})
