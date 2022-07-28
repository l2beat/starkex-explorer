import { initCountdownTimer } from './countdownTimer'
import { initMetamask } from './metamask'
import { initAcceptOfferForm } from './offer/acceptForm'
import { initCancelOfferForm } from './offer/cancelForm'
import { initOffersFilteringForm } from './offer/filteringForm'
import { initFinalizeForm } from './offer/finalizeForm'
import { initPagination } from './pagination'
import { initFinalizeExitForm } from './transaction/finalizeExitForm'
import { initTransactionForm } from './transaction/transactionForm'
import { initTVLDisplay } from './tvl'

initTVLDisplay()
initMetamask()
initPagination()
initTransactionForm()
initOffersFilteringForm()
initAcceptOfferForm()
initCancelOfferForm()
initFinalizeForm()
initFinalizeExitForm()
initCountdownTimer()
