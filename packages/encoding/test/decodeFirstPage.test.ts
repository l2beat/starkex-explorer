import { decodeFirstPage } from '../src/decodeFirstPage'
import REAL_DATA from './data/onchain-example.json'

describe('decodeFirstPage', () => {
  it('decodes real onchain data', () => {
    const values = decodeFirstPage(REAL_DATA[0].join(''))
    // TODO: check against expected values
  })
})
