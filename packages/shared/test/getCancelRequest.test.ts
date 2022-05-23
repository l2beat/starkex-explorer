import { expect } from 'earljs'

import { getCancelRequest } from '../src'

describe(getCancelRequest.name, () => {
  it('works properly', () => {
    expect(getCancelRequest(1)).toEqual(
      ['{', `  "cancel": true,`, `  "offerId": 1`, '}'].join('\n')
    )
  })
})
