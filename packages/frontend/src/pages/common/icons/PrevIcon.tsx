import React from 'react'

export function PrevIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 8 13"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g clipPath="url(#a)">
        <path
          d="M7.41 1.91 6 .5l-6 6 6 6 1.41-1.41L2.83 6.5l4.58-4.59Z"
          fill="#FAFAFA"
        />
      </g>
      <defs>
        <clipPath id="a">
          <path fill="#fff" transform="translate(0 .5)" d="M0 0h8v12H0z" />
        </clipPath>
      </defs>
    </svg>
  )
}
