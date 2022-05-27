import React, { ReactNode } from 'react'

interface HiddenInputsProps {
  params: URLSearchParams
}

export function HiddenInputs({ params }: HiddenInputsProps) {
  const inputs: ReactNode[] = []
  params.forEach((value, key) => {
    inputs.push(<input type="hidden" name={key} value={value} key={key} />)
  })
  return <>{...inputs}</>
}
