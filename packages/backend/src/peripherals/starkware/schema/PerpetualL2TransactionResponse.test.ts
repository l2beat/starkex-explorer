import { expect } from 'earl'

import { EXAMPLE_PERPETUAL_TRANSACTIONS } from '../../../test/starkwareData'
import { PerpetualL2TransactionResponse } from './PerpetualL2TransactionResponse'

describe('PerpetualL2TransactionResponse', () => {
  it('can parse real data', () => {
    const fn = () =>
      PerpetualL2TransactionResponse.parse(EXAMPLE_PERPETUAL_TRANSACTIONS)
    expect(fn).not.toThrow()
  })
})
