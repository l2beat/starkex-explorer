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
      <div className="sticky top-0 z-50 flex items-center justify-center gap-4 bg-yellow-300 px-6 py-0.5 text-center text-black">
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
          dYdX v3 is undergoing a planned shutdown and the operator is inactive.
          Currently, anyone can freeze the exchange.
        </span>
        <a href="/freeze" className="underline">
          Read more
        </a>
      </div>
    )
  }
  if (freezeStatus === 'frozen') {
    return (
      <div className="sticky top-0 z-50 flex items-center justify-center gap-4 bg-yellow-300 py-1.5 text-center text-black">
        <span>
          ⚠️ dYdX v3 has been discontinued and the exchange contracts are
          frozen. Use the{' '}
          <a href="/tutorials/escapehatch" className="underline">
            Escape Hatch
          </a>{' '}
          functionality to withdraw your funds.
        </span>
      </div>
    )
  }

  return null
}
