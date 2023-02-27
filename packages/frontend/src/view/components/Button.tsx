import cx from 'classnames'
import React from 'react'

import { Link } from './Link'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant
}

type ButtonVariant = 'contained' | 'outlined'
const mainClassNames =
  'py-2.5 text-sm font-semibold disabled:cursor-not-allowed px-8'
const classNameMap: Record<ButtonVariant, string> = {
  contained:
    'bg-brand rounded hover:bg-brand-darker disabled:bg-white disabled:bg-opacity-20',
  outlined:
    'bg-transparent border border-brand hover:bg-brand hover:bg-opacity-20 rounded-lg',
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

interface LinkButtonProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  readonly variant?: ButtonVariant
  readonly href: string
}

export function LinkButton({
  variant = 'contained',
  className,
  children,
  href,
  ...rest
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cx(
        'text-center !text-white !no-underline',
        mainClassNames,
        classNameMap[variant],
        className
      )}
      {...rest}
    >
      {children}
    </Link>
  )
}
