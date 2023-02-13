import React from 'react'

interface PositionIdViewProps {
  positionId: bigint
}

export function PositionIdView(props: PositionIdViewProps) {
  return (
    <div className="flex flex-col gap-1">
      <div>Position</div>
      <div className="bg-gray-100 flex items-center gap-2 rounded-md p-2">
        <span className="font-mono text-2xl leading-none">
          {props.positionId.toString()}
        </span>
        <span className="bg-blue-100 rounded-full px-2">Owned by you</span>
      </div>
    </div>
  )
}
