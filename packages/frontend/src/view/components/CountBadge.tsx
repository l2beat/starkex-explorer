import React from 'react'

interface CountBadgeProps {
  count: number
}

export function CountBadge({ count }: CountBadgeProps) {
  return (
    <div className="m-auto rounded-full bg-brand px-2 py-1 text-sm font-semibold">
      {count}
    </div>
  )
}
