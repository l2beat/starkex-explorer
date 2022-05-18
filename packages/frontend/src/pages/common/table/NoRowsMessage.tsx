import React from 'react'

interface NoRowsMessageProps {
  text: string
  colSpan: number
}

export function NoRowsMessage({ text, colSpan }: NoRowsMessageProps) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="first-letter:capitalize bg-grey-200 pt-4 pb-4 text-center"
      >
        {text}
      </td>
    </tr>
  )
}
