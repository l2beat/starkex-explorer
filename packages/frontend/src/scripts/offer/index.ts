import { initFinalizeExitForm } from '../old/transaction/finalizeExitForm'
import { initAcceptOfferForm } from './acceptForm'
import { initCancelOfferForm } from './cancelForm'

export function initForcedTradeOfferForms() {
  initAcceptOfferForm()
  initCancelOfferForm()
  initFinalizeExitForm()
}
