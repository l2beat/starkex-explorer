import { expect } from 'earljs'

import DECODED_EXAMPLE from '../test/data/spot-decoded-example.json'
import ENCODED_EXAMPLE from '../test/data/spot-encoded-example.json'
import { decodeSpotCairoOutput } from './decodeSpotCairoOutput'

describe('decodeOnChainSpotData', () => {
  it('decodes the example data', () => {
    const decoded = decodeSpotCairoOutput(ENCODED_EXAMPLE)
    const noBigInt = JSON.parse(
      JSON.stringify(decoded, (k, v) => (typeof v === 'bigint' ? Number(v) : v))
    )
    expect(noBigInt).toEqual(DECODED_EXAMPLE)
  })
})
