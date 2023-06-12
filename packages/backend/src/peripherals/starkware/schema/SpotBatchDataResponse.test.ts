import { expect } from 'earl'

import { EXAMPLE_SPOT_BATCH_DATA } from '../../../test/starkwareData'
import { SpotBatchDataResponse } from './SpotBatchDataResponse'

describe('SpotBatchResponse', () => {
  it('can parse real data', () => {
    const fn = () => SpotBatchDataResponse.parse(EXAMPLE_SPOT_BATCH_DATA)
    expect(fn).not.toThrow()
  })

  it('can parse a non-existent update', () => {
    expect(() => SpotBatchDataResponse.parse({ update: null })).not.toThrow()
  })
})
