import cx from 'classnames'
import React, { ComponentPropsWithoutRef, ElementType } from 'react'

import { Spinner } from './Spinner'

type ButtonProps<T extends ElementType> = {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  as?: T
} & ComponentPropsWithoutRef<T> &
  // eslint-disable-next-line @typescript-eslint/ban-types
  (T extends 'a' ? { disabled?: boolean } : {})

type ButtonVariant = 'contained' | 'outlined'
const variantClassNames: Record<ButtonVariant, string> = {
  contained:
    'bg-brand hover:bg-brand-darker disabled:bg-white disabled:bg-opacity-20',
  outlined:
    'bg-transparent border border-brand hover:bg-brand hover:bg-opacity-20',
}

type ButtonSize = 'sm' | 'md' | 'lg'
const sizeClassNames: Record<ButtonSize, string> = {
  sm: 'h-8 text-sm rounded',
  md: 'h-10 text-md rounded-lg',
  lg: 'h-12 text-md rounded-lg',
}

const spinnerSizeClassNames: Record<ButtonSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

export function Button<T extends ElementType = 'button'>({
  variant = 'contained',
  size = 'md',
  className,
  children,
  as,
  ...rest
}: ButtonProps<T>) {
  const Comp = as ?? 'button'
  return (
    <Comp
      className={cx(
        'group flex items-center justify-center px-8 py-2.5 font-semibold transition-colors disabled:cursor-not-allowed',
        variantClassNames[variant],
        sizeClassNames[size],
        className
      )}
      {...rest}
    >
      <span
        className={cx(size === 'sm' && 'group-data-[state=loading]:hidden')}
      >
        {children}
      </span>
      <Spinner
        className={cx(
          'hidden group-data-[state=loading]:block',
          size !== 'sm' && 'ml-2',
          spinnerSizeClassNames[size]
        )}
      />
    </Comp>
  )
}
