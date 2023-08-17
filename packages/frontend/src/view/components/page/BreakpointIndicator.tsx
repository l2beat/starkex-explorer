import React from 'react'

export function BreakpointIndicator() {
  return (
    <div className="fixed bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-tl-lg bg-brand stroke-white text-sm opacity-80">
      <div className="block  sm:hidden md:hidden lg:hidden xl:hidden 2xl:hidden">
        xs
      </div>
      <div className="hidden sm:block  md:hidden lg:hidden xl:hidden 2xl:hidden">
        sm
      </div>
      <div className="hidden sm:hidden md:block  lg:hidden xl:hidden 2xl:hidden">
        md
      </div>
      <div className="hidden sm:hidden md:hidden lg:block  xl:hidden 2xl:hidden">
        lg
      </div>
      <div className="hidden sm:hidden md:hidden lg:hidden xl:block  2xl:hidden">
        xl
      </div>
      <div className="hidden sm:hidden md:hidden lg:hidden xl:hidden 2xl:block">
        2xl
      </div>
    </div>
  )
}
