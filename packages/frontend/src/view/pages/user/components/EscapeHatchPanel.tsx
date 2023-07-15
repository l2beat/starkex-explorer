import { StarkKey } from '@explorer/types'
import React from 'react'

import { LinkButton } from '../../../components/Button'
import { SectionHeading } from '../../../components/SectionHeading'

interface EscapeHatchPanelProps {
  starkKey: StarkKey
}

export function EscapeHatchPanel(props: EscapeHatchPanelProps) {
  return (
    <div>
      <SectionHeading title="Escape Hatch" />
      <section className="flex w-full flex-col rounded-lg bg-gray-800 p-6">
        The exchange is frozen, which means that ....
        <LinkButton className="w-32" href="/">
          Escape
        </LinkButton>
      </section>
    </div>
  )
}
