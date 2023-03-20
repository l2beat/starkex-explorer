import { USE_NEW_DESIGN } from '../utils/constants'
import { initCountdownTimer } from './countdownTimer'
import { initForcedActionForms } from './forced-actions/forcedActionForm'
import { initImageFallback } from './imageFallback'
import { initMetamask } from './metamask'
import { initForcedTradeOfferForms } from './offer'
import { initAcceptOfferForm } from './old/offer/acceptForm'
import { initCancelOfferForm } from './old/offer/cancelForm'
import { initOffersFilteringForm } from './old/offer/filteringForm'
import { initFinalizeForm } from './old/offer/finalizeForm'
// eslint-disable-next-line no-restricted-imports
import { initOldPagination } from './old/pagination'
// eslint-disable-next-line no-restricted-imports
import { initFinalizeExitForm } from './old/transaction/finalizeExitForm'
// eslint-disable-next-line no-restricted-imports
import { initTransactionForm } from './old/transaction/transactionForm'
import { initPagination } from './pagination'
import { initStateUpdateStats } from './stateUpdateStats'
import { initTVLDisplay } from './tvl'

initMetamask()

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
if (USE_NEW_DESIGN) {
  initForcedActionForms()
  initImageFallback()
  initPagination()
  initStateUpdateStats()
  initForcedTradeOfferForms()
} else {
  initTVLDisplay()
  initCountdownTimer()
  initOldPagination()
  initTransactionForm()
  initOffersFilteringForm()
  initAcceptOfferForm()
  initCancelOfferForm()
  initFinalizeForm()
  initFinalizeExitForm()
}
