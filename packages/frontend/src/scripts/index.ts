import { initForcedActionForms } from './forced-actions/forcedActionForm'
import { initForcedTradeOfferForms } from './forced-actions/perpetual/offer'
import { initImageFallback } from './imageFallback'
import { initStarkKeyRecovery } from './keys/starkKeyRecovery'
import { initStarkKeyRegistration } from './keys/starkKeyRegistration'
import { initMetamask } from './metamask'
import { initPagination } from './pagination'
import { initRegularWithdrawalForm } from './regularWithdrawal'
import { initStateUpdateStats } from './stateUpdateStats'
import { initTooltips } from './tooltips'

initMetamask()
initForcedActionForms()
initImageFallback()
initPagination()
initStateUpdateStats()
initStarkKeyRecovery()
initForcedTradeOfferForms()
initRegularWithdrawalForm()
initStarkKeyRegistration()
initTooltips()
