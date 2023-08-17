import React from 'react'

export function Tooltip() {
  return (
    <div className="Tooltip-Popup z-60 text-gray-700 fixed left-0 top-0 hidden max-w-[300px] rounded-md bg-gray-800 px-4 py-3 text-left text-sm leading-tight text-white  shadow-[0px_4px_12px_0px_rgba(0,0,0,0.55)]">
      <span />
      <svg
        width="16"
        height="8"
        viewBox="0 0 16 8"
        className="Tooltip-Triangle -z-1 fixed left-0 top-0 h-2 w-4 fill-gray-800 stroke-1"
      >
        <path d="M0 8L8 1L16 8" />
      </svg>
    </div>
  )
}

interface TooltipWrapperProps {
  children: React.ReactNode
  content: string
}

export function TooltipWrapper({ children, content }: TooltipWrapperProps) {
  return (
    <span className="Tooltip" title={content}>
      {children}
    </span>
  )
}
