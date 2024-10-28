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
      <InfoBanner>
        <span>
          This exchange can be frozen due to inactivity of the operator.
        </span>
        <a href="/freeze" className="underline">
          Read more
        </a>
      </InfoBanner>
    )
  }
  if (freezeStatus === 'frozen') {
    return (
      <WarningBanner>
        <span>This exchange is frozen and no longer operates normally. </span>
      </WarningBanner>
    )
  }
  return null
}

function DydxSunsetFreezeBanner({
  freezeStatus,
}: {
  freezeStatus: FreezeStatus
}) {
  if (freezeStatus === 'frozen') {
    return (
      <WarningBanner>
        <span>
          ⚠️ dYdX v3 has been discontinued and the exchange contracts are
          frozen. Use the{' '}
          <a href="/tutorials/escapehatch" className="underline">
            Escape Hatch
          </a>{' '}
          functionality to withdraw your funds.
        </span>
      </WarningBanner>
    )
  }

  return (
    <InfoBanner>
      {freezeStatus === 'freezable' ? (
        <>
          <span>
            dYdX v3 is undergoing a planned shutdown and the operator is
            inactive. Currently, anyone can freeze the exchange.
          </span>{' '}
          <a href="/freeze" className="underline">
            Read more
          </a>
        </>
      ) : (
        <>
          <span>
            dYdX v3 has stopped trading. Funds will be withdrawable after
            October 30, ~14:30 UTC.
          </span>{' '}
          <a
            href="https://dydx.exchange/blog/v3-product-sunset"
            target="_blank"
            className="underline"
          >
            Read more
          </a>
        </>
      )}
    </InfoBanner>
  )
}

function InfoBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-balance sticky top-0 z-50 bg-brand px-6 py-0.5 text-center text-sm leading-tight text-white md:text-lg md:leading-normal">
      {children}
    </div>
  )
}

function WarningBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-balance sticky top-0 z-50 bg-yellow-300 px-6 py-0.5 text-center text-sm leading-tight text-black md:text-lg md:leading-normal">
      {children}
    </div>
  )
}
