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
      <span className="wide:block hidden">First</span>
      <FirstPageIcon
        className="wide:hidden my-1 block"
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
      <span className="wide:block hidden">Last</span>
      <LastPageIcon className="wide:hidden my-1 block" width={14} height={12} />
    </>
  )
}
