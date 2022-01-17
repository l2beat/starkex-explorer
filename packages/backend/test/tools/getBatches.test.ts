import { expect } from 'earljs'

import { getBatches } from '../../src/tools/getBatches'

describe(getBatches.name, () => {
  it('works', () => {
    expect(getBatches(0, 9, 2)).toEqual([
      [0, 1],
      [2, 3],
      [4, 5],
      [6, 7],
      [8, 9],
    ])
  })

  it('handles batch size bigger than range', () => {
    expect(getBatches(0, 4, 10)).toEqual([[0, 4]])
  })
})
