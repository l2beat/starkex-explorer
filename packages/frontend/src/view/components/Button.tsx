import cx from 'classnames'
import React from 'react'

import { Link } from './Link'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant
}

type ButtonVariant = 'contained' | 'outlined'
const mainClassNames =
  'py-2.5 text-sm font-semibold disabled:cursor-not-allowed px-8 rounded'
const classNameMap: Record<ButtonVariant, string> = {
  contained:
    'bg-brand hover:bg-brand-darker disabled:bg-white disabled:bg-opacity-20',
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
      className={cx(mainClassNames, classNameMap[variant], className)}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  )
}

interface LinkButtonProps extends React.HTMLProps<HTMLAnchorElement> {
  readonly variant?: ButtonVariant
  readonly href: string
}

export function LinkButton({
  variant = 'contained',
  className,
  children,
  href,
  disabled,
  ...rest
}: LinkButtonProps) {
  return (
    <Link
      href={disabled ? undefined : href}
      disabled={disabled}
      className={cx(
        'flex items-center justify-center !text-white !no-underline',
        mainClassNames,
        disabled
          ? 'cursor-not-allowed bg-white bg-opacity-20'
          : classNameMap[variant],
        className
      )}
      {...rest}
    >
      {children}
    </Link>
  )
}
