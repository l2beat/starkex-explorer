import { expect } from 'chai'

import { partition } from '../../src/tools/partition'

describe(partition.name, () => {
  it('partitions an array of numbers given a predicate', () => {
    const [evens, odds] = partition(
      Array.from(Array(10).keys()),
      (x) => x % 2 === 0
    )

    expect(evens).to.deep.eq([0, 2, 4, 6, 8])
    expect(odds).to.deep.eq([1, 3, 5, 7, 9])
  })

  it('partitions an array of union types given type predicate', () => {
    type A = { a: number }
    type B = { b: number }
    type AB = A | B
    const xs: AB[] = [{ a: 1 }, { b: 2 }, { a: 3 }, { b: 4 }]

    const [as, bs] = partition(xs, (x): x is A => 'a' in x)

    expect(as.map((a) => a.a)).to.deep.eq([1, 3])
    expect(bs.map((b) => b.b)).to.deep.eq([2, 4])
  })
})
