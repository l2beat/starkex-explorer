import { expect } from 'earl'

import { EXAMPLE_PERPETUAL_BATCH_INFO } from '../../../test/starkwareData'
import { PerpetualBatchInfoResponse } from './PerpetualBatchInfoResponse'

describe('PerpetualBatchInfoResponse', () => {
  it('can parse real data', () => {
    const fn = () =>
      PerpetualBatchInfoResponse.parse(EXAMPLE_PERPETUAL_BATCH_INFO)
    fn()
    expect(fn).not.toThrow()
  })
})
