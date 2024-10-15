import { PageContext } from '@explorer/shared'
import React from 'react'

import { L2BeatLogo } from '../../assets/logos/L2BeatLogo'
import { StarkWareLogo } from '../../assets/logos/StarkWareLogo'
import { TermsOfServiceAck } from '../TermsOfServiceAck'

interface FooterProps {
  readonly context: PageContext
}

export function Footer({ context }: FooterProps) {
  const { instanceName } = context
  return (
    <footer className="flex flex-wrap items-baseline	justify-between gap-y-3 whitespace-normal border-t border-t-zinc-800 p-6 text-sm">
      <span>
        Built by{' '}
        <L2BeatLogo
          height={18}
          width={44}
          className="relative top-[-2px] mx-1 inline-block"
        />{' '}
        team and funded by
        <StarkWareLogo height={18} width={98} className="ml-1 inline-block" />
      </span>
      {instanceName === 'dYdX' && (
        <TermsOfServiceAck prefix="By accessing this website you agree to our" />
      )}
      <span className="text-zinc-500">
        Copyright {new Date().getFullYear()} L2BEAT
      </span>
    </footer>
  )
}
