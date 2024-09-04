import classNames from 'classnames'
import React from 'react'

export function ChevronDownIcon({
  className,
  ...rest
}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...rest}
    >
      <path
        d="M12.0006 14.071L8.17964 10.25C7.76564 9.83595 7.09364 9.83595 6.67964 10.25C6.26564 10.664 6.26564 11.336 6.67964 11.75L11.2936 16.364C11.6846 16.755 12.3176 16.755 12.7076 16.364L17.3216 11.75C17.7356 11.336 17.7356 10.664 17.3216 10.25C16.9076 9.83595 16.2356 9.83595 15.8216 10.25L12.0006 14.071Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function ChevronLeftIcon({
  className,
  ...rest
}: React.SVGProps<SVGSVGElement>) {
  return (
    <ChevronDownIcon {...rest} className={classNames('rotate-90', className)} />
  )
}

export function ChevronUpIcon({
  className,
  ...rest
}: React.SVGProps<SVGSVGElement>) {
  return (
    <ChevronDownIcon
      {...rest}
      className={classNames('rotate-180', className)}
    />
  )
}

export function ChevronRightIcon({
  className,
  ...rest
}: React.SVGProps<SVGSVGElement>) {
  return (
    <ChevronDownIcon
      {...rest}
      className={classNames('-rotate-90', className)}
    />
  )
}
