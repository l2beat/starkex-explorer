import React from 'react'

import { InfoIcon } from '../common/icons/InfoIcon'
import { FormId } from './ids'

export function InfoText() {
  return (
    <div id={FormId.InfoSection} className="flex items-center gap-4">
      <InfoIcon className="min-w-[20px]" />
      <p>
        This position also contains other assets. Exiting USDC will leave those
        assets in the system. To exit those assets convert them to USDC first.
      </p>
    </div>
  )
}
