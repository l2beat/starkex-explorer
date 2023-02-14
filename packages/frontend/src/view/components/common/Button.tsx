import cx from 'classnames'
import React from 'react'

type ButtonVariant = 'CONTAINED' | 'OUTLINED'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant
}

const variantMap: Record<ButtonVariant, string> = {
  CONTAINED: 'mx-auto w-32 rounded bg-brand py-2 text-sm',
  OUTLINED:
    'rounded-lg border border-solid border-brand py-3 px-8 text-base hover:bg-opacity-20',
}

export function Button({
  onClick,
  className,
  variant = 'CONTAINED',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cx(
        '!m-0 cursor-pointer font-semibold text-white',
        variantMap[variant],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
