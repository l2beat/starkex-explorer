import { PageContext } from '@explorer/shared'
import React from 'react'

import { InfoIcon } from '../../../assets/icons/InfoIcon'
import { Card } from '../../../components/Card'

interface DydxStoppedInfoPanelProps {
  context: PageContext
}

export function DydxStoppedInfoPanel(props: DydxStoppedInfoPanelProps) {
  if (props.context.instanceName !== 'dYdX') {
    return null
  }
  return (
    <section>
      <Card className="flex flex-col gap-3 bg-yellow-300 bg-opacity-20">
        <div className="flex">
          <InfoIcon className="mr-1.5 mt-px shrink-0 fill-yellow-300" />
          <p className="font-bold leading-tight text-yellow-300">
            dYdX v3 has stopped trading.
          </p>
        </div>
        <p className="mb-1.5 text-sm font-semibold leading-tight">
          Forced withdrawals will not be executed. Withdrawals will be available
          via Escape Hatch mechanism after October 30, ~14:30 UTC.
        </p>
      </Card>
    </section>
  )
}
