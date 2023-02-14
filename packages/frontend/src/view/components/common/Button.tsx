import cx from 'classnames'
import React from 'react'

type ButtonVariant = 'CONTAINED' | 'OUTLINED'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant
}

const variantMap: Record<ButtonVariant, string> = {
  CONTAINED:
    'mx-auto w-32 rounded bg-brand py-2 text-sm font-semibold text-white',
  OUTLINED:
    'rounded-lg border border-solid border-brand py-3 px-8 text-base font-semibold text-white',
}

export function Button({
  onClick,
  className,
  variant = 'CONTAINED',
  children,
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cx(
        '!m-0 cursor-pointer',
        {
          'mx-auto w-32 rounded bg-brand py-2 text-sm font-semibold text-white':
            variant === 'CONTAINED',
        },
        {
          'rounded-lg border border-solid border-brand py-3 px-8 text-base font-semibold text-white':
            variant === 'OUTLINED',
        },
        variantMap[variant],
        className
      )}
    >
      {children}
    </button>
  )
}
