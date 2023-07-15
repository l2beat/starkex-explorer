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
            The exchange is frozen, preventing it from executing regular
            operations or supporting standard actions.
          </span>
          <span className="mb-3">
            You have the option to request a withdrawal of the entire value of
            this position by activating an 'escape hatch.' This process involves
            interacting with an Ethereum contract, which calculates the total
            value of the position, including any open trades and funding rates.
          </span>
          <span className="mb-3">
            The escape process consists of three steps: initiating (verifying)
            the escape, finalizing the escape, and withdrawing the funds. The
            final step can only be carried out by the owner of this position.
          </span>
          <span className="mb-3">
            Please note, the execution of an Escape can be expensive due to
            Ethereum gas cost.
          </span>
        </div>
        <div className="mx-8">
          <LinkButton href="/">Initiate Escape</LinkButton>
        </div>
      </section>
    </div>
  )
}
