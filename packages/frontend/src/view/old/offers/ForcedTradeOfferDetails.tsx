import React from 'react'

import { ForcedHistory } from '../common/ForcedHistory'
import { SectionHeading } from '../common/header/SectionHeading'
import { Page } from '../common/page/Page'
import { AcceptOfferForm } from './accept-form/AcceptOfferForm'
import { CancelOfferForm } from './cancel-form'
import { FinalizeOfferForm } from './finalize-form'
import { ForcedTradeOfferDetailsProps } from './ForcedTradeOfferDetailsProps'
import { ForcedTradeOfferHeader } from './ForcedTradeOfferHeader'
import { ForcedTradeOfferStats } from './ForcedTradeOfferStats'

export function ForcedTradeOfferDetails(props: ForcedTradeOfferDetailsProps) {
  return (
    <Page
      title={`Forced trade offer ${props.offer.id}`}
      description="View the details of the forced trade offer and a timeline of events from creation to inclusion in a state update."
      path={`/forced/offers/${props.offer.id}`}
      account={props.account}
    >
      <ForcedTradeOfferHeader offerId={props.offer.id} type={props.offer.type}>
        <div className="flex gap-x-2">
          {props.acceptForm && (
            <AcceptOfferForm {...props.acceptForm}>
              <button className="text-base bg-blue-700 rounded-md px-4 py-2 text-white">
                Accept &amp; {props.offer.type === 'buy' ? 'sell' : 'buy'}
              </button>
            </AcceptOfferForm>
          )}
          {props.cancelForm && (
            <CancelOfferForm {...props.cancelForm}>
              <button className="text-base bg-blue-700 rounded-md px-4 py-2 text-white">
                Cancel
              </button>
            </CancelOfferForm>
          )}
          {props.finalizeForm && (
            <FinalizeOfferForm {...props.finalizeForm}>
              <button className="text-base bg-blue-700 rounded-md px-4 py-2 text-white">
                Finalize
              </button>
            </FinalizeOfferForm>
          )}
        </div>
      </ForcedTradeOfferHeader>
      <SectionHeading>Stats</SectionHeading>
      <ForcedTradeOfferStats offer={props.offer} />
      <ForcedHistory events={props.history} />
    </Page>
  )
}
