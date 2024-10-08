import React from 'react'

import { Link } from './Link'

export function TermsOfServiceAck({ prefix }: { prefix?: string }) {
  return (
    <div className="text-center">
      {prefix ?? 'By accessing this website, you agree to our '}{' '}
      <Link href="/tos">Terms of Service</Link>
    </div>
  )
}
