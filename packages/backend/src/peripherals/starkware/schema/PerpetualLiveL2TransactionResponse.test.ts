import { expect } from 'earl'

import { EXAMPLE_PERPETUAL_TRANSACTIONS } from '../../../test/starkwareData'
import { PerpetualLiveL2TransactionResponse } from './PerpetualLiveL2TransactionResponse'

describe('PerpetualL2TransactionResponse', () => {
  it('can parse real data', () => {
    const fn = () =>
      PerpetualLiveL2TransactionResponse.parse(EXAMPLE_PERPETUAL_TRANSACTIONS)
    expect(fn).not.toThrow()
  })
})
