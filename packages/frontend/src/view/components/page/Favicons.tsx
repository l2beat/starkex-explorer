import React from 'react'

export function Favicons({ isDydx }: { isDydx: boolean }) {
  if (isDydx) {
    return (
      <>
        <link
          rel="icon"
          type="image/svg+xml"
          href="https://dydx.trade/favicon.svg"
        />
      </>
    )
  }

  return (
    <>
      {/* <link rel="shortcut icon" href="/favicon.png" />
      <link rel="icon" href="/favicon.svg" />
      <link rel="apple-touch-icon" href="/favicon.png" />
      <link rel="mask-icon" href="/mask-icon.svg" color="#000000" /> */}
    </>
  )
}
