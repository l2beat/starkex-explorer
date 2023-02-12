import React from 'react'

import { FirstPageIcon } from '../icons/FirstPageIcon'
import { LastPageIcon } from '../icons/LastPageIcon'
import { NextIcon } from '../icons/NextIcon'
import { PrevIcon } from '../icons/PrevIcon'

export const Inside = {
  FirstPage,
  Previous,
  Next,
  LastPage,
}

function FirstPage() {
  return (
    <>
      <span className="hidden wide:block">First</span>
      <FirstPageIcon
        className="my-1 block wide:hidden"
        width={14}
        height={12}
      />
    </>
  )
}

function Previous() {
  return <PrevIcon width={8} height={12} />
}

function Next() {
  return <NextIcon width={8} height={12} />
}

function LastPage() {
  return (
    <>
      <span className="hidden wide:block">Last</span>
      <LastPageIcon className="my-1 block wide:hidden" width={14} height={12} />
    </>
  )
}
