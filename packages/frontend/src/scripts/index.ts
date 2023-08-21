import { initCopyButtons } from './copyButtons'
import { initExpandableContainers } from './expandableContainers'
import { initForcedActionForms } from './forced-actions/forcedActionForm'
import { initForcedTradeOfferForms } from './forced-actions/perpetual/offer'
import { initImageFallback } from './imageFallback'
import { initStarkKeyRecovery } from './keys/starkKeyRecovery'
import { initStarkKeyRegistration } from './keys/starkKeyRegistration'
import { initMetamask } from './metamask'
import { initPagination } from './pagination'
import { initRegularWithdrawalForm } from './regularWithdrawal'
import { initTabs } from './tabs'
import { initTooltips } from './tooltips'

// #region UI elements
initTabs()
initCopyButtons()
initTooltips()
initPagination()
initExpandableContainers()
// #endregion
// #region Forms
initStarkKeyRecovery()
initStarkKeyRegistration()
initForcedActionForms()
initForcedTradeOfferForms()
initRegularWithdrawalForm()
// #endregion
// #region Misc
initImageFallback()
initMetamask()
// #endregion
