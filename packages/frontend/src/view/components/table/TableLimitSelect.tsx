import React from 'react'

export interface TableLimitSelectProps {
  link: string
  limit: number
  currentPage: number
}

export function TableLimitSelect(props: TableLimitSelectProps) {
  const options = [...new Set([10, 25, 50, 100, 200, props.limit])]
  options.sort((a, b) => a - b)

  return (
    <form
      data-component="TableLimitSelect"
      action={props.link}
      method="get"
      className="flex items-baseline gap-1"
    >
      <label className="text-sm font-medium" htmlFor="per-page">
        Per page
      </label>
      <select
        name="perPage"
        autoComplete="off"
        defaultValue={props.limit}
        className="w-14 rounded bg-gray-800 px-2 py-0.5 font-semibold"
      >
        {options.map((n) => (
          <option key={n} selected={n === props.limit}>
            {n}
          </option>
        ))}
      </select>
      <input className="hidden" name="page" defaultValue={props.currentPage} />
    </form>
  )
}
