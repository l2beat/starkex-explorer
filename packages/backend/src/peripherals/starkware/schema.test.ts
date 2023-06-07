import { expect } from 'earl'
import { it } from 'mocha'

import {
  EXAMPLE_PERPETUAL_BATCH,
  EXAMPLE_PERPETUAL_BATCH_INFO,
  EXAMPLE_PERPETUAL_TRANSACTIONS,
  EXAMPLE_SPOT_BATCH,
} from '../../test/starkwareData'
import {
  PerpetualBatchDataResponse,
  PerpetualBatchInfoResponse,
  PerpetualL2TransactionResponse,
  SpotBatchDataResponse,
} from './schema'

describe('PerpetualBatchResponse', () => {
  it('can parse real data', () => {
    const fn = () => PerpetualBatchDataResponse.parse(EXAMPLE_PERPETUAL_BATCH)
    expect(fn).not.toThrow()
  })

  it('can parse a non-existent update', () => {
    expect(() =>
      PerpetualBatchDataResponse.parse({ update: null })
    ).not.toThrow()
  })
})

describe('SpotBatchResponse', () => {
  it('can parse real data', () => {
    const fn = () => SpotBatchDataResponse.parse(EXAMPLE_SPOT_BATCH)
    expect(fn).not.toThrow()
  })

  it('can parse a non-existent update', () => {
    expect(() => SpotBatchDataResponse.parse({ update: null })).not.toThrow()
  })
})

describe('PerpetualTransactionBatchResponse', () => {
  it('can parse real data', () => {
    const fn = () =>
      PerpetualBatchInfoResponse.parse(EXAMPLE_PERPETUAL_BATCH_INFO)
    fn()
    expect(fn).not.toThrow()
  })
})

describe('PerpetualTransactionResponse', () => {
  it('can parse real data', () => {
    const fn = () =>
      PerpetualL2TransactionResponse.parse(EXAMPLE_PERPETUAL_TRANSACTIONS)
    expect(fn).not.toThrow()
  })
})
