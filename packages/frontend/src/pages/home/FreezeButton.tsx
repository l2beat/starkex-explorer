import cx from 'classnames'
import React from 'react'

interface FreezeButtonProps {
  active?: boolean
}

export function FreezeButton({ active }: FreezeButtonProps) {
  const text = active ? 'Freeze' : 'Freeze (inactive)'
  const activeClasses =
    'px-4 text-white font-bold text-2xl leading-7 bg-blue-100'
  const inactiveClasses = 'p-4 bg-grey-200 text-grey-400 leading-5'
  return (
    <button
      className={cx(
        'rounded-md w-[25%] h-[50px] hidden md:block',
        active ? activeClasses : inactiveClasses
      )}
      disabled={!active}
    >
      {text}
    </button>
  )
}
