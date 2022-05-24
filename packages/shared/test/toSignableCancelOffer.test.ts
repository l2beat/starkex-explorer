import { expect } from 'earljs'

import { toSignableCancelOffer } from '../src'

describe(toSignableCancelOffer.name, () => {
  it('works properly', () => {
    expect(toSignableCancelOffer(1)).toEqual(
      ['{', `  "cancel": true,`, `  "offerId": 1`, '}'].join('\n')
    )
  })
})
