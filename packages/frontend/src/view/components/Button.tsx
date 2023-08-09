import cx from 'classnames'
import React, { ComponentPropsWithoutRef, ElementType } from 'react'

type ButtonProps<T extends ElementType> = {
  variant?: ButtonVariant
  className?: string
  as?: T
} & ComponentPropsWithoutRef<T> &
  // eslint-disable-next-line @typescript-eslint/ban-types
  (T extends 'a' ? { disabled?: boolean } : {})

type ButtonVariant = 'contained' | 'outlined'
const mainClassNames =
  'py-2.5 text-sm text-center font-semibold disabled:cursor-not-allowed px-8 rounded transition-colors'
const classNameMap: Record<ButtonVariant, string> = {
  contained:
    'bg-brand hover:bg-brand-darker disabled:bg-white disabled:bg-opacity-20',
  outlined:
    'bg-transparent border border-brand hover:bg-brand hover:bg-opacity-20',
}

export function Button<T extends ElementType = 'button'>({
  variant = 'contained',
  className,
  children,
  as,
  ...rest
}: ButtonProps<T>) {
  const Comp = as ?? 'button'
  return (
    <Comp
      className={cx(mainClassNames, classNameMap[variant], className)}
      {...rest}
    >
      {children}
    </Comp>
  )
}
