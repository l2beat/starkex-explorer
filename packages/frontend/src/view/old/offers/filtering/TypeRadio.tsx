import cx from 'classnames'
import React from 'react'

import { OfferType } from '../ForcedTradeOffersIndexProps'
import { DisabledOptionValue, TypeRadioName } from './attributes'

interface TypeButtonProps {
  id: string
  value: string
  checked: boolean
  label: string
}

function TypeButton({ id, value, checked, label }: TypeButtonProps) {
  return (
    <div className={cx(checked && 'bg-gray-300', 'rounded-md')}>
      <input
        className="absolute appearance-none"
        type="radio"
        id={id}
        name={TypeRadioName}
        value={value}
        checked={checked}
        readOnly
      />
      <label htmlFor={id} className="block cursor-pointer py-1 px-3">
        {label}
      </label>
    </div>
  )
}

interface TypeRadioProps {
  type?: OfferType
}

export function TypeRadio(props: TypeRadioProps) {
  return (
    <div className="bg-gray-200 flex cursor-pointer rounded-md">
      {['buy', 'sell'].map((type) => {
        const checked = props.type === type
        const label = type.slice(0, 1).toUpperCase() + type.slice(1)
        return (
          <TypeButton
            id={type}
            value={type}
            checked={checked}
            label={label}
            key={type}
          />
        )
      })}
      <TypeButton
        id="all"
        value={DisabledOptionValue}
        checked={!props.type}
        label="All"
        key="all"
      />
    </div>
  )
}
