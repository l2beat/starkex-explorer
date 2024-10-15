import { PageContext } from '@explorer/shared'
import React from 'react'

import { TermsOfServiceAck } from '../TermsOfServiceAck'

interface FooterProps {
  readonly context: PageContext
}

export function Footer({ context }: FooterProps) {
  const { instanceName } = context
  return (
    <footer className="flex flex-wrap items-baseline justify-center gap-y-3 whitespace-normal border-t border-t-zinc-800 p-6 text-sm">
      <TermsOfServiceAck
        prefix="By accessing this website you agree to our"
        instanceName={instanceName}
      />
    </footer>
  )
}
