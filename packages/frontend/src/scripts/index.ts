import { initCountdownTimer } from './countdownTimer'
import { initMetamask } from './metamask'
import { initAcceptOfferForm } from './offer/acceptForm'
import { initCancelOfferForm } from './offer/cancelForm'
import { initOffersFilteringForm } from './offer/filteringForm'
import { initPagination } from './pagination'
import { initTransactionForm } from './transaction/transactionForm'
import { initTVLDisplay } from './tvl'

initTVLDisplay()
initMetamask()
initPagination()
initTransactionForm()
initOffersFilteringForm()
initAcceptOfferForm()
initCancelOfferForm()
initCountdownTimer()
