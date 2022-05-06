import React from 'react'

import { InfoIcon } from '../common/icons/InfoIcon'

export function InfoText() {
  return (
    <div className="flex gap-4 items-center">
      <InfoIcon className="min-w-[20px]" />
      <p>
        This position also contains other assets. Exiting USDC will leave those
        assets in the system. To exit those assets convert them to USDC first.
      </p>
    </div>
  )
}
