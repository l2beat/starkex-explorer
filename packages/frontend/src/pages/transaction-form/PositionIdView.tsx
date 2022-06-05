import React from 'react'

interface PositionIdViewProps {
  positionId: bigint
}

export function PositionIdView(props: PositionIdViewProps) {
  return (
    <div className="flex flex-col gap-1">
      <div>Position</div>
      <div className="bg-grey-100 rounded-md p-2 gap-2 flex items-center">
        <span className="text-2xl leading-none font-mono">
          {props.positionId.toString()}
        </span>
        <span className="px-2 rounded-full bg-blue-100">Owned by you</span>
      </div>
    </div>
  )
}
