import cx from 'classnames'
import React from 'react'
type ForcedActionActionCardProps = React.HTMLAttributes<HTMLDivElement>

export function ForcedActionCard({
  children,
  className,
  ...rest
}: ForcedActionActionCardProps) {
  return (
    <div className={cx('rounded-lg bg-slate-800 p-4', className)} {...rest}>
      {children}
    </div>
  )
}
