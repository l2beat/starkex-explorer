import { InstanceName } from '@explorer/shared'
import React from 'react'

import { Link } from './Link'

export function TermsOfServiceAck({
  prefix,
  instanceName,
}: {
  prefix?: string
  instanceName: InstanceName
}) {
  return instanceName === 'dYdX' ? (
    <div className="text-center leading-tight">
      {prefix ?? 'By accessing this website, you agree to dYdX v3'}{' '}
      <Link href="https://dydx.exchange/terms">Terms of Use</Link>
    </div>
  ) : null
}
