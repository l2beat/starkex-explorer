import React from 'react'

import { ReplacedIcon } from '../../../assets/icons/ReplacedIcon'

export function ReplacedBadge() {
  return (
    <div className="bg-y flex items-center justify-center gap-1.5">
      <ReplacedIcon className="fill-yellow-700" />
      <span className="text-sm text-yellow-700 ">Replaced</span>
    </div>
  )
}
