import { expect } from 'earl'

import { getApexGoerliConfig } from '../../config/starkex/apex-goerli'
import { getDydxMainnetConfig } from '../../config/starkex/dydx-mainnet'
import { shouldSkipDataAvailabilityModeField } from './shouldSkipDataAvailabilityModeField'

describe('shouldSkipDataAvailabilityModeField', () => {
  it('should return true when instanceName is "ApeX", chainId is 5 and blockNumber is >= 8056029', () => {
    const config = getApexGoerliConfig()
    expect(shouldSkipDataAvailabilityModeField(8056028, config)).toEqual(false)
    expect(shouldSkipDataAvailabilityModeField(8056029, config)).toEqual(true)
    expect(shouldSkipDataAvailabilityModeField(9000000, config)).toEqual(true)
  })

  it('should return false when instanceName is "Dydx", chainId is 1 and blockNumber is >= 8056029', () => {
    const config = getDydxMainnetConfig()
    expect(shouldSkipDataAvailabilityModeField(8056028, config)).toEqual(false)
    expect(shouldSkipDataAvailabilityModeField(8056029, config)).toEqual(false)
    expect(shouldSkipDataAvailabilityModeField(9000000, config)).toEqual(false)
  })
})
