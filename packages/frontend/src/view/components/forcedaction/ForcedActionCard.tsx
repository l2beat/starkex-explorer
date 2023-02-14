import React from 'react'

export function ForcedActionActionCard() {
  return (
    <div className="rounded-lg bg-slate-800 p-4">
      <div className="flex justify-between text-sm text-zinc-500">
        <span>Amount</span>
        <span>Balance: 230.50</span>
      </div>
      <div className="flex items-end justify-between font-semibold">
        <span className="text-2xl">125.50</span>
        <span className="text-lg">USDC</span>
      </div>
    </div>
  )
}
