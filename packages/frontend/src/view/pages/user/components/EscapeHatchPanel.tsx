import { StarkKey } from '@explorer/types'
import React from 'react'

import { LinkButton } from '../../../components/Button'
import { SectionHeading } from '../../../components/SectionHeading'

interface EscapeHatchPanelProps {
  starkKey: StarkKey
}

export function EscapeHatchPanel(_props: EscapeHatchPanelProps) {
  return (
    <div>
      <SectionHeading title="Escape Hatch" />
      <section className="flex w-full rounded-lg bg-gray-800 p-6">
        <div className="max-w flex flex-col">
          <span className="mb-3">
            The exchange is frozen, which means that it doesn't operate normally
            and doesn't support any regular actions.
          </span>
          <span className="mb-3">
            You can request withdrawal of full value of this position by
            triggering an "escape hatch". This is done by interacting with
            Ethereum contract which also calculates the full value of this
            position (including open trades and funding rates).
          </span>
          <span className="mb-3">
            Escaping is a 3-step process: requesting (verifying) the escape,
            finalizing the escape, and withdrawing the funds. The last step must
            be performed by this position's owner.
          </span>
          <span className="mb-3">
            Be aware that performing an Escape may be expensive due to Ethereum
            gas cost.
          </span>
        </div>
        <div className="mx-8">
          <LinkButton href="/">Request Escape</LinkButton>
        </div>
      </section>
    </div>
  )
}
