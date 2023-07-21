import cx from 'classnames'
import React, { ComponentPropsWithoutRef, ElementType } from 'react'

type ButtonProps<T extends ElementType> = {
  variant?: ButtonVariant
  as?: T
} & ComponentPropsWithoutRef<T> &
  (T extends 'a' ? { disabled?: boolean } : {})

type ButtonVariant = 'contained' | 'outlined'
const mainClassNames =
  'py-2.5 text-sm font-semibold disabled:cursor-not-allowed px-8 rounded'
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
