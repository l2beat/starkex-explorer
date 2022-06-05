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
              <button className="bg-blue-100 text-white px-4 py-2 text-base rounded-md">
                Accept &amp; {props.offer.type ? 'sell' : 'buy'}
              </button>
            </AcceptOfferForm>
          )}
          {props.cancelForm && (
            <CancelOfferForm {...props.cancelForm}>
              <button className="bg-blue-100 text-white px-4 py-2 text-base rounded-md">
                Cancel
              </button>
            </CancelOfferForm>
          )}
          {props.finalizeForm && (
            <FinalizeOfferForm {...props.finalizeForm}>
              <button className="bg-blue-100 text-white px-4 py-2 text-base rounded-md">
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
