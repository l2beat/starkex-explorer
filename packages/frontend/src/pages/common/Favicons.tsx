import React from 'react'
import { resolveStatic } from '../util'

export function Favicons() {
  return (
    <>
      <link rel="shortcut icon" href={resolveStatic('/favicon.png')} />
      <link rel="icon" href={resolveStatic('/favicon.svg')} />
      <link rel="apple-touch-icon" href={resolveStatic('/favicon.png')} />
      <link
        rel="mask-icon"
        href={resolveStatic('/mask-icon.svg')}
        color="#000000"
      />
    </>
  )
}
