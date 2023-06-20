import { expect } from 'earl'

import DECODED_EXAMPLE from '../test/data/decoded-with-dataavail-field.json'
import ENCODED_EXAMPLE from '../test/data/encoded-with-dataavail-field.json'
import { decodePerpetualCairoOutput } from './decodePerpetualCairoOutput'

describe('decodePerpetualCairoOutput', () => {
  it('decodes data with skipDataAvailabilityModeField', () => {
    // passing true to skipDataAvailabilityModeField
    const decoded = decodePerpetualCairoOutput(ENCODED_EXAMPLE, true)
    const noBigInt = JSON.parse(
      JSON.stringify(decoded, (k, v) => (typeof v === 'bigint' ? Number(v) : v))
    )
    expect(noBigInt).toEqual(DECODED_EXAMPLE)
  })
})
