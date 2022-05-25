import cx from 'classnames'
import React from 'react'

import { OfferType } from '../ForcedTradeOffersIndexProps'

export function TypeRadio({ type = 'all' }: { type?: OfferType | 'all' }) {
  return (
    <div className="rounded-md bg-grey-200 flex cursor-pointer">
      {['buy', 'sell', 'all'].map((_type) => {
        const checked = type === _type
        const label = _type[0].toUpperCase() + _type.slice(1)

        return (
          <div
            className={cx(checked && 'bg-grey-300', 'py-1 px-3 rounded-md')}
            key={_type}
          >
            <input
              className="appearance-none"
              type="radio"
              id={_type}
              name="type"
              value={_type}
              checked={checked}
              readOnly
            />
            <label htmlFor={_type} className="cursor-pointer">
              {label}
            </label>
          </div>
        )
      })}
    </div>
  )
}
