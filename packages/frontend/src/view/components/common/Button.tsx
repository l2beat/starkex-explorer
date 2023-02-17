import cx from 'classnames'
import React from 'react'
import { Link } from './Link'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant
}

type ButtonVariant = 'contained' | 'outlined'
const mainClassNames =
  'min-w-[150px] rounded-lg px-10 py-2.5 text-sm font-semibold disabled:cursor-not-allowed'
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
