import React from 'react'

export function WarningIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="16"
      height="17"
      viewBox="0 0 16 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M15.7377 13.1922L8.66 1.92012C8.66 1.92012 8.4695 1.52637 8 1.52637C7.5305 1.52637 7.34 1.92012 7.34 1.92012L0.26225 13.1922C0.26225 13.1922 0.125 13.3764 0.125 13.625C0.125 14.0394 0.460625 14.375 0.875 14.375H15.125C15.5394 14.375 15.875 14.0394 15.875 13.625C15.875 13.3764 15.7377 13.1922 15.7377 13.1922Z"
        fill="url(#paint0_linear_511_4725)"
      />
      <path
        d="M8.00627 13.25C7.67844 13.25 7.40794 13.1501 7.19476 12.9503C6.98159 12.7505 6.875 12.5089 6.875 12.2245C6.875 11.9279 6.98248 11.6849 7.1979 11.4955C7.41287 11.306 7.68247 11.2115 8.00627 11.2115C8.3341 11.2115 8.60281 11.3074 8.81151 11.4986C9.02065 11.6903 9.125 11.932 9.125 12.2245C9.125 12.521 9.02155 12.7658 8.81464 12.9593C8.60773 13.1528 8.33813 13.25 8.00627 13.25ZM9.00139 4.57445L8.78598 10.0532C8.77926 10.2206 8.64222 10.3529 8.47562 10.3529H7.49975C7.3327 10.3529 7.19566 10.2201 7.18939 10.0523L6.98562 4.574C6.9789 4.39715 7.11997 4.25 7.29598 4.25H8.69148C8.86749 4.25 9.00856 4.39715 9.00139 4.57445Z"
        fill="url(#paint1_radial_511_4725)"
      />
      <defs>
        <linearGradient
          id="paint0_linear_511_4725"
          x1="1"
          y1="2.12659e-07"
          x2="12.5"
          y2="15"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FFDA1C" />
          <stop offset="1" stopColor="#F7931A" />
        </linearGradient>
        <radialGradient
          id="paint1_radial_511_4725"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(5.39754 4.15145) scale(10.0153 10.0634)"
        >
          <stop stopColor="#4B4B4B" />
          <stop offset="0.531" stopColor="#393939" />
          <stop offset="1" stopColor="#252525" />
        </radialGradient>
      </defs>
    </svg>
  )
}
