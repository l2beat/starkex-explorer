import React from 'react'

import { Button } from '../../components/Button'
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
          {props.acceptOfferFormData && (
            <AcceptOfferForm {...props.acceptOfferFormData}>
              <Button>
                Accept &amp; {props.offer.type === 'buy' ? 'sell' : 'buy'}
              </Button>
            </AcceptOfferForm>
          )}
          {props.cancelOfferFormData && (
            <CancelOfferForm {...props.cancelOfferFormData}>
              <Button variant="outlined">Cancel</Button>
            </CancelOfferForm>
          )}
          {props.finalizeOfferFormData && (
            <FinalizeOfferForm {...props.finalizeOfferFormData}>
              <Button>Send transaction</Button>
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
