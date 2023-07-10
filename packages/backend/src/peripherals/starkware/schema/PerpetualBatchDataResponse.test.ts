import { expect } from 'earl'

import { EXAMPLE_PERPETUAL_BATCH_DATA } from '../../../test/starkwareData'
import { PerpetualBatchDataResponse } from './PerpetualBatchDataResponse'

describe('PerpetualBatchDataResponse', () => {
  it('can parse real data', () => {
    const fn = () =>
      PerpetualBatchDataResponse.parse(EXAMPLE_PERPETUAL_BATCH_DATA)
    expect(fn).not.toThrow()
  })

  it('can parse a non-existent update', () => {
    expect(() =>
      PerpetualBatchDataResponse.parse({ update: null })
    ).not.toThrow()
  })
})
