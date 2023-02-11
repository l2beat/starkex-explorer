import cx from 'classnames'
import React from 'react'

import { OfferEntry } from './UserProps'

const backgroundMap = {
    "CREATED": "bg-blue-400", 
    "ACCEPTED": "bg-gradient-to-r from-blue-400 to-green-500", 
    "SENT": "bg-green-500", 
    "EXPIRED": "bg-grey-500",
    "CANCELLED": "bg-grey-500",
}

interface OfferStatusProps {
    status: OfferEntry['status']
}

export function OfferStatus({status}: OfferStatusProps) {
    return(
        <div className={cx('px-2 py-1 rounded-full font-bold text-xs w-max', {'text-white': status === 'EXPIRED' || status === 'CANCELLED'}, {'text-background': status !== 'EXPIRED' && status !== 'CANCELLED'}, backgroundMap[status])}>
            {status}
        </div>
    );
}
