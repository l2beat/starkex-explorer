import { USE_NEW_DESIGN } from '../utils/constants'
import { initCountdownTimer } from './countdownTimer'
import { initForcedActionForms } from './forced-actions/forcedActionForm'
import { initImageFallback } from './imageFallback'
import { initMetamask } from './metamask'
import { initAcceptOfferForm } from './offer/acceptForm'
import { initCancelOfferForm } from './offer/cancelForm'
import { initOffersFilteringForm } from './offer/filteringForm'
import { initFinalizeForm } from './offer/finalizeForm'
// eslint-disable-next-line no-restricted-imports
import { initOldPagination } from './old/pagination'
// eslint-disable-next-line no-restricted-imports
import { initFinalizeExitForm } from './old/transaction/finalizeExitForm'
// eslint-disable-next-line no-restricted-imports
import { initTransactionForm } from './old/transaction/transactionForm'
import { initPagination } from './pagination'
import { initRegularWithdrawal } from './regularWithdrawal'
import { initStateUpdateStats } from './stateUpdateStats'
import { initTVLDisplay } from './tvl'

initTVLDisplay()
initMetamask()
initOldPagination()
initOffersFilteringForm()
initAcceptOfferForm()
initCancelOfferForm()
initFinalizeForm()
initFinalizeExitForm()
initCountdownTimer()

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
if (USE_NEW_DESIGN) {
  initForcedActionForms()
  initImageFallback()
  initPagination()
  initStateUpdateStats()
  initRegularWithdrawal()
} else {
  initTransactionForm()
}
