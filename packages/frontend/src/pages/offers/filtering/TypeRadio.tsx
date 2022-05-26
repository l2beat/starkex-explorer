import cx from 'classnames'
import React from 'react'

import { OfferType } from '../ForcedTradeOffersIndexProps'
import { DisabledOptionValue, TypeRadioName } from './attributes'

interface InputProps {
  id: string
  value: string
  checked: boolean
  label: string
}

function Input({ id, value, checked, label }: InputProps) {
  return (
    <div className={cx(checked && 'bg-grey-300', 'py-1 px-3 rounded-md')}>
      <input
        className="appearance-none"
        type="radio"
        id={id}
        name={TypeRadioName}
        value={value}
        checked={checked}
        readOnly
      />
      <label htmlFor={id} className="cursor-pointer">
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
    <div className="rounded-md bg-grey-200 flex cursor-pointer">
      {['buy', 'sell'].map((type) => {
        const checked = props.type === type
        const label = type[0].toUpperCase() + type.slice(1)
        return (
          <Input
            id={type}
            value={type}
            checked={checked}
            label={label}
            key={type}
          />
        )
      })}
      <Input
        id="all"
        value={DisabledOptionValue}
        checked={!props.type}
        label="All"
        key="all"
      />
    </div>
  )
}
