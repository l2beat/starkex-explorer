import React from 'react'

interface CountBadgeProps {
  count: number
}

export function CountBadge({ count }: CountBadgeProps) {
  return (
    <div className="m-auto rounded-full bg-brand px-2 py-1 text-xs font-semibold">
      {shortenNumber(count)}
    </div>
  )
}

const shortenNumber = (count: number) => {
  if (count < 1000) {
    return count
  }
  if (count < 1000000) {
    return `${Math.floor(count / 1000)}k`
  }
  return `${Math.floor(count / 1000000)}m`
}
