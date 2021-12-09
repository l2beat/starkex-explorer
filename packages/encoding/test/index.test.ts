import { expect } from 'chai'

import { decode } from '../src'

describe('decode', () => {
  it('decodes "1" as 1', () => {
    expect(decode('1')).to.equal(1)
  })
})
