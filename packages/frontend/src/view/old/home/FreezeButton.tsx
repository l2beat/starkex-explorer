import cx from 'classnames'
import React from 'react'

interface FreezeButtonProps {
  active?: boolean
}

export function FreezeButton({ active }: FreezeButtonProps) {
  const text = active ? 'Freeze' : 'Freeze (inactive)'
  const activeClasses =
    'px-4 text-white font-bold text-2xl leading-7 bg-blue-700'
  const inactiveClasses = 'p-4 bg-gray-200 text-gray-400 leading-5'
  return (
    <button
      className={cx(
        'hidden h-[50px] w-[25%] rounded-md md:block',
        active ? activeClasses : inactiveClasses
      )}
      disabled={!active}
    >
      {text}
    </button>
  )
}
