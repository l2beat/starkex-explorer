import { USE_NEW_DESIGN } from '../utils/constants'
import { initCountdownTimer } from './countdownTimer'
import { initForcedActionForms } from './forced-actions/forcedActionForm'
import { initImageFallback } from './imageFallback'
import { initStarkKeyRecovery } from './keys/starkKeyRecovery'
import { initStarkKeyRegistration } from './keys/starkKeyRegistration'
import { initMetamask } from './metamask'
import { initForcedTradeOfferForms } from './offer'
// eslint-disable-next-line no-restricted-imports
import { initAcceptOfferForm } from './old/offer/acceptForm'
// eslint-disable-next-line no-restricted-imports
import { initCancelOfferForm } from './old/offer/cancelForm'
// eslint-disable-next-line no-restricted-imports
import { initOffersFilteringForm } from './old/offer/filteringForm'
// eslint-disable-next-line no-restricted-imports
import { initFinalizeForm } from './old/offer/finalizeForm'
// eslint-disable-next-line no-restricted-imports
import { initOldPagination } from './old/pagination'
// eslint-disable-next-line no-restricted-imports
import { initFinalizeExitForm } from './old/transaction/finalizeExitForm'
// eslint-disable-next-line no-restricted-imports
import { initTransactionForm } from './old/transaction/transactionForm'
import { initPagination } from './pagination'
import { initRegularWithdrawalForm } from './regularWithdrawal'
import { initStateUpdateStats } from './stateUpdateStats'
import { initTVLDisplay } from './tvl'

initMetamask()

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
if (USE_NEW_DESIGN) {
  initForcedActionForms()
  initImageFallback()
  initPagination()
  initStateUpdateStats()
  initStarkKeyRecovery()
  initForcedTradeOfferForms()
  initRegularWithdrawalForm()
  initStarkKeyRegistration()
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
