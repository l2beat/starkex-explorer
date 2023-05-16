import { expect } from 'earl'
import { it } from 'mocha'

import {
  EXAMPLE_PERPETUAL_BATCH,
  EXAMPLE_PERPETUAL_LIVE_TRANSACTIONS,
  EXAMPLE_PERPETUAL_TRANSACTION_BATCH,
  EXAMPLE_SPOT_BATCH,
} from '../../test/starkwareData'
import {
  PerpetualBatchResponse,
  PerpetualLiveTransactionResponse,
  PerpetualTransactionBatchResponse,
  SpotBatchResponse,
} from './schema'

describe('PerpetualBatchResponse', () => {
  it('can parse real data', () => {
    const fn = () => PerpetualBatchResponse.parse(EXAMPLE_PERPETUAL_BATCH)
    expect(fn).not.toThrow()
  })

  it('can parse a non-existent update', () => {
    expect(() => PerpetualBatchResponse.parse({ update: null })).not.toThrow()
  })
})

describe('SpotBatchResponse', () => {
  it('can parse real data', () => {
    const fn = () => SpotBatchResponse.parse(EXAMPLE_SPOT_BATCH)
    expect(fn).not.toThrow()
  })

  it('can parse a non-existent update', () => {
    expect(() => SpotBatchResponse.parse({ update: null })).not.toThrow()
  })
})

describe('PerpetualTransactionBatchResponse', () => {
  it('can parse real data', () => {
    const fn = () =>
      PerpetualTransactionBatchResponse.parse(
        EXAMPLE_PERPETUAL_TRANSACTION_BATCH
      )
    fn()
    expect(fn).not.toThrow()
  })
})

describe('PerpetualLiveTransactionResponse', () => {
  it('can parse real data', () => {
    const fn = () =>
      PerpetualLiveTransactionResponse.parse(
        EXAMPLE_PERPETUAL_LIVE_TRANSACTIONS
      )
    expect(fn).not.toThrow()
  })
})
