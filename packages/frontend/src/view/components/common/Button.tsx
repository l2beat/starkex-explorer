import cx from 'classnames'
import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant
}

type ButtonVariant = 'primary' | 'outline'

const classNameMap: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white',
  outline:
    'bg-transparent border border-brand text-white hover:bg-brand hover:bg-opacity-10',
}

export function Button({
  variant = 'primary',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cx(
        'mx-auto min-w-[150px] rounded-lg px-10 py-2.5 text-sm font-semibold',
        classNameMap[variant],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
