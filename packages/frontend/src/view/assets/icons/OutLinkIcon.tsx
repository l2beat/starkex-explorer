import cx from 'classnames'
import React from 'react'

export function OutLinkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="16"
      height="17"
      viewBox="0 0 16 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
      className={cx('stroke-blue-500', props.className)}
    >
      <path
        d="M12.8333 10.5V12.3333C12.8333 13.438 11.938 14.3333 10.8333 14.3333H4.16667C3.06201 14.3333 2.16667 13.438 2.16667 12.3333V5.66667C2.16667 4.562 3.06201 3.66667 4.16667 3.66667H6"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.83333 8.66667L13.6667 2.83333"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.16667 2.66667H13.8333V7.33333"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
