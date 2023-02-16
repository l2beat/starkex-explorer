import cx from 'classnames'
import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant
}

type ButtonVariant = 'contained' | 'outlined'

const classNameMap: Record<ButtonVariant, string> = {
  contained: 'bg-brand',
  outlined:
    'bg-transparent border border-brand hover:bg-brand hover:bg-opacity-20',
}

export function Button({
  variant = 'contained',
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cx(
        'mx-auto min-w-[150px] rounded-lg px-10 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed',
        classNameMap[variant],
        className
      )}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  )
}
