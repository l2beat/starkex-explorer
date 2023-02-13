import React from 'react'

interface StatProps {
  title: string
  value: string
  valueId?: string
}

export function Stat({ title, value, valueId }: StatProps) {
  return (
    <div className="flex w-full items-center rounded-sm bg-grey-300 py-1 px-2 md:block md:w-[25%] md:rounded-md md:py-2 md:px-4">
      <div className="w-full md:mb-2">{title}</div>
      <div
        className="w-full text-right font-sans text-2xl font-bold"
        id={valueId}
      >
        {value}
      </div>
    </div>
  )
}
