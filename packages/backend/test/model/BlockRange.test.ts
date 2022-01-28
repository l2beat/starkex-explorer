import { expect } from 'earljs'

import { BlockRange } from '../../src/model/BlockRange'

describe(BlockRange.name, () => {
  it('has .from and .to properties', () => {
    const blockRange = new BlockRange([
      { number: 1, hash: '0x1' },
      { number: 2, hash: '0x2' },
      { number: 3, hash: '0x3' },
    ])

    expect(blockRange.from).toEqual(1)
    expect(blockRange.to).toEqual(3)
  })

  describe(BlockRange.prototype.has.name, () => {
    it('returns true if range has the hash under block number', () => {
      const blockRange = new BlockRange([
        { number: 1, hash: '0x1' },
        { number: 2, hash: '0x2' },
        { number: 3, hash: '0x3' },
      ])

      expect(blockRange.has({ blockNumber: 1, blockHash: '0x1' })).toEqual(true)
      expect(blockRange.has({ blockNumber: 2, blockHash: '0x2' })).toEqual(true)
      expect(blockRange.has({ blockNumber: 3, blockHash: '0x3' })).toEqual(true)
    })

    it('returns false if range does not have the hash under block number', () => {
      const blockRange = new BlockRange([{ hash: '0x10', number: 10 }])

      expect(blockRange.has({ blockNumber: 10, blockHash: '0x123' })).toEqual(
        false
      )

      expect(
        blockRange.has({ blockNumber: 13987297, blockHash: '0x123' })
      ).toEqual(false)
    })
  })

  describe(BlockRange.from.name, () => {
    it('creates a new BlockRange with given hashes and numbers', () => {
      expect(
        BlockRange.from({
          1: '0x3',
          2: '0x4',
        })
      ).toEqual(
        new BlockRange([
          { number: 1, hash: '0x3' },
          { number: 2, hash: '0x4' },
        ])
      )
    })
  })
})
