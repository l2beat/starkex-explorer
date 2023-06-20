import { expect } from 'earl'

import { shouldSkipDataAvailabilityModeField } from './shouldSkipDataAvailabilityModeField'

describe('shouldSkipDataAvailabilityModeField', () => {
  it('should return true when instanceName is "ApeX", chainId is 5 and blockNumber is >= 8056029', () => {
    expect(shouldSkipDataAvailabilityModeField(8056028, 'ApeX', 5)).toEqual(
      false
    )
    expect(shouldSkipDataAvailabilityModeField(8056029, 'ApeX', 5)).toEqual(
      true
    )
    expect(shouldSkipDataAvailabilityModeField(9000000, 'ApeX', 5)).toEqual(
      true
    )
  })

  it('should return false when instanceName is "Dydx", chainId is 1 and blockNumber is >= 8056029', () => {
    expect(shouldSkipDataAvailabilityModeField(8056028, 'dYdX', 1)).toEqual(
      false
    )
    expect(shouldSkipDataAvailabilityModeField(8056029, 'dYdX', 1)).toEqual(
      false
    )
    expect(shouldSkipDataAvailabilityModeField(9000000, 'dYdX', 1)).toEqual(
      false
    )
  })
})
