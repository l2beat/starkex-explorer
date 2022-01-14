import { expect } from 'earljs'

import { decodeOnChainData } from '../src'
import REAL_DECODED from './data/onchain-decoded.json'
import REAL_DATA from './data/onchain-example.json'

describe('decodeOnChainData', () => {
  it('decodes real onchain data', () => {
    const decoded = decodeOnChainData(REAL_DATA.map((x) => x.join('')))
    const noBigInt = JSON.parse(
      JSON.stringify(decoded, (k, v) => (typeof v === 'bigint' ? Number(v) : v))
    )
    expect(noBigInt).toEqual(REAL_DECODED)
  })
})
