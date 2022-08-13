import React from 'react'

interface StatProps {
  title: string
  value: string
  valueId?: string
}

export function Stat({ title, value, valueId }: StatProps) {
  return (
    <div className="py-1 md:py-2 px-2 md:px-4 bg-grey-300 rounded-sm md:rounded-md flex md:block w-full md:w-[25%] items-center">
      <div className="w-full md:mb-2">{title}</div>
      <div
        className="font-sans font-bold text-2xl w-full text-right"
        id={valueId}
      >
        {value}
      </div>
    </div>
  )
}
