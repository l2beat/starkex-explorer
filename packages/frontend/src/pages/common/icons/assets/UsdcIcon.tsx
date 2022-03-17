import React from 'react'

export function UsdcIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      {...props}
    >
      <rect y="0.5" width="16" height="16" fill="url(#pattern0)" />
      <defs>
        <pattern
          id="pattern0"
          patternContentUnits="objectBoundingBox"
          width="1"
          height="1"
        >
          <use xlinkHref="#image0_4248_79454" transform="scale(0.02)" />
        </pattern>
        <image
          id="image0_4248_79454"
          width="50"
          height="50"
          xlinkHref="data:image/png;base64,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"
        />
      </defs>
    </svg>
  )
}
