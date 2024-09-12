import { FreezeStatus, InstanceName } from '@explorer/shared'
import React from 'react'

export function FreezeBanner({
  instanceName,
  freezeStatus,
}: {
  instanceName: InstanceName
  freezeStatus: FreezeStatus
}) {
  if (instanceName === 'dYdX') {
    return <DydxSunsetFreezeBanner freezeStatus={freezeStatus} />
  }

  if (freezeStatus === 'freezable') {
    return (
      <div className="sticky top-0 z-50 flex items-center justify-center gap-4 bg-brand px-6 py-0.5 text-center text-white">
        <span>
          This exchange can be frozen due to inactivity of the operator.
        </span>
        <a href="/freeze" className="underline">
          Read more
        </a>
      </div>
    )
  }
  if (freezeStatus === 'frozen') {
    return (
      <div className="sticky top-0 z-50 flex items-center justify-center gap-4 bg-red-500 px-6 py-0.5 text-center text-white">
        <span>This exchange is frozen and no longer operates normally. </span>
      </div>
    )
  }
  return null
}

function DydxSunsetFreezeBanner({
  freezeStatus,
}: {
  freezeStatus: FreezeStatus
}) {
  if (freezeStatus === 'freezable') {
    return (
      <div className="sticky top-0 z-50 flex items-center justify-center gap-4 bg-brand px-6 py-0.5 text-center text-white">
        <span>
          dYdX v3 is undergoing a planned sunsetting, and the operator is
          inactive. Currently, anyone can freeze the exchange.
        </span>
        <a href="/freeze" className="underline">
          Read more
        </a>
      </div>
    )
  }
  if (freezeStatus === 'frozen') {
    return (
      <div className="sticky top-0 z-50 flex items-center justify-center gap-4 bg-yellow-700 px-6 py-0.5 text-center text-white">
        <span>
          dYdX v3 has been sunset, and the exchange contracts are frozen. Please
          use the{' '}
          <a href="/tutorials/escapehatch" className="underline">
            escape hatch
          </a>{' '}
          functionality if you'd like to withdraw your funds.
        </span>
      </div>
    )
  }

  return null
}
