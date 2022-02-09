import { expect } from 'earljs'
import { range } from 'lodash'

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
    it('returns true if range has the hash under block number', () => {
      const [h1, h2, h3] = range(3).map((i) => Hash256.fake(String(i)))

      const blockRange = new BlockRange([
        { number: 1, hash: h1 },
        { number: 2, hash: h2 },
        { number: 3, hash: h3 },
      ])

      expect(blockRange.has({ blockNumber: 1, blockHash: h1 })).toEqual(true)
      expect(blockRange.has({ blockNumber: 2, blockHash: h2 })).toEqual(true)
      expect(blockRange.has({ blockNumber: 3, blockHash: h3 })).toEqual(true)
    })

    it('returns false if range does not have the hash under block number', () => {
      const hash = Hash256.fake('0')
      const blockRange = new BlockRange([{ hash, number: 10 }])

      expect(
        blockRange.has({ blockNumber: 10, blockHash: Hash256.fake('1') })
      ).toEqual(false)

      expect(
        blockRange.has({ blockNumber: 13987297, blockHash: Hash256.fake('1') })
      ).toEqual(false)

      expect(
        blockRange.has({ blockNumber: 13987297, blockHash: hash })
      ).toEqual(false)
    })
  })
})
