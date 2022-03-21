import React from 'react'

type StatProps = {
  title: string
  value: string
  valueId?: string
}

export function Stat({ title, value, valueId }: StatProps) {
  return (
    <div className="py-2 px-4 bg-grey-300 rounded-md w-[25%]">
      <div className="w-full mb-2">{title}</div>
      <div
        className="font-sans font-bold text-2xl w-full text-right"
        id={valueId}
      >
        {value}
      </div>
    </div>
  )
}
