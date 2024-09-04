import classNames from 'classnames'
import React from 'react'

export function CopyIcon({
  className,
  ...rest
}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
      className={classNames('inline cursor-pointer fill-white', className)}
      {...rest}
    >
      <g clipPath="url(#clip0_1041_8610)">
        <path
          d="M5.59996 0.199982C4.93696 0.199982 4.39996 0.736982 4.39996 1.39998V11C4.39996 11.663 4.93696 12.2 5.59996 12.2H13.4C14.063 12.2 14.6 11.663 14.6 11V4.09998C14.6 3.94098 14.537 3.78856 14.4242 3.67576L11.1242 0.375763C11.0114 0.262963 10.859 0.199982 10.7 0.199982H5.59996ZM10.4 1.34256L13.4574 4.39998H11C10.6688 4.39998 10.4 4.13118 10.4 3.79998V1.34256ZM2.59996 3.19998C1.93696 3.19998 1.39996 3.73698 1.39996 4.39998V14C1.39996 14.663 1.93696 15.2 2.59996 15.2H10.4C11.063 15.2 11.6 14.663 11.6 14V13.4H5.59996C4.27636 13.4 3.19996 12.3236 3.19996 11V3.19998H2.59996Z"
          fillOpacity="0.8"
        />
      </g>
      <defs>
        <clipPath id="clip0_1041_8610">
          <rect width="16" height="16" />
        </clipPath>
      </defs>
    </svg>
  )
}
