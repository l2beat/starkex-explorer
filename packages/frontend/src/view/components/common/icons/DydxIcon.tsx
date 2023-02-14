import React from 'react'

export function DydxIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="26"
      height="28"
      viewBox="0 0 26 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M19.4149 0L0.291016 27.9977H6.16246L25.3855 0H19.4149Z"
        fill="white"
      />
      <path
        d="M6.77355 0L12.4003 8.25L9.46462 12.75L0.779785 0H6.77355Z"
        fill="url(#paint0_linear_0_1)"
      />
      <path
        d="M19.985 28L13.7466 18.875L16.6823 14.5L25.8564 28H19.985Z"
        fill="url(#paint1_linear_0_1)"
      />
      <defs>
        <linearGradient
          id="paint0_linear_0_1"
          x1="5.428"
          y1="1.75"
          x2="13.6908"
          y2="11.5112"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" />
          <stop offset="1" stopColor="white" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_0_1"
          x1="21.3304"
          y1="25.8751"
          x2="11.1557"
          y2="12.4522"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#6966FF" />
          <stop offset="1" stopColor="#6966FF" stopOpacity="0.36" />
        </linearGradient>
      </defs>
    </svg>
  )
}
