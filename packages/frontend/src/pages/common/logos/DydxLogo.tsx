import React from 'react'

export function DydxLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 103 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g clipPath="url(#a)">
        <path d="M95.199 0 73.062 31.714h6.796L102.11 0h-6.911Z" fill="#fff" />
        <path
          d="m80.566 0 6.514 9.345-3.399 5.098L73.628 0h6.938Z"
          fill="url(#b)"
        />
        <path
          d="m95.858 31.717-7.22-10.336 3.397-4.956 10.62 15.292h-6.797Z"
          fill="url(#c)"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M65.133 0h5.947v31.714h-5.947V30.53A12.044 12.044 0 0 1 59.346 32c-6.657 0-12.054-5.373-12.054-12S52.69 8 59.346 8c2.097 0 4.07.533 5.787 1.47V0Zm-5.85 26.733c3.77 0 6.827-3.043 6.827-6.796 0-3.754-3.056-6.797-6.827-6.797-3.77 0-6.827 3.043-6.827 6.797 0 3.753 3.056 6.796 6.827 6.796Z"
          fill="#fff"
        />
        <path d="M47.884 0 25.77 31.714h6.933L54.795 0h-6.911Z" fill="#fff" />
        <path
          d="m32.708 0 6.938 9.628-3.823 5.38L25.487 0h7.221Z"
          fill="url(#d)"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M17.84 0h5.948v31.714H17.84V30.53A12.043 12.043 0 0 1 12.054 32C5.398 32 0 26.627 0 20S5.397 8 12.055 8c2.096 0 4.068.533 5.786 1.47V0Zm-5.849 26.733c3.77 0 6.827-3.043 6.827-6.796 0-3.754-3.056-6.797-6.827-6.797-3.77 0-6.827 3.043-6.827 6.797 0 3.753 3.056 6.796 6.827 6.796Z"
          fill="#fff"
        />
      </g>
      <defs>
        <linearGradient
          id="b"
          x1={79.009}
          y1={1.982}
          x2={88.333}
          y2={13.239}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fff" />
          <stop offset={1} stopColor="#fff" stopOpacity={0.55} />
        </linearGradient>
        <linearGradient
          id="c"
          x1={97.416}
          y1={29.31}
          x2={85.96}
          y2={13.866}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#6966FF" />
          <stop offset={1} stopColor="#6966FF" stopOpacity={0.36} />
        </linearGradient>
        <linearGradient
          id="d"
          x1={31.15}
          y1={2.06}
          x2={40.816}
          y2={13.879}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fff" />
          <stop offset={1} stopColor="#fff" stopOpacity={0.55} />
        </linearGradient>
        <clipPath id="a">
          <path fill="#fff" d="M0 0h102.796v32H0z" />
        </clipPath>
      </defs>
    </svg>
  )
}
