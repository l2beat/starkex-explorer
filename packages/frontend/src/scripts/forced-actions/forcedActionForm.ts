import { initFreezeRequestForm } from './escape/freezeRequestForm'
import { initVerifyEscapeForm } from './escape/verifyEscapeForm'
import { initPerpetualForcedActionForm } from './perpetual/perpetualForcedActionForm'
import { initSpotForcedWithdrawalForm } from './spot/spotForcedWithdrawalForm'

export function initForcedActionForms() {
  initPerpetualForcedActionForm()
  initSpotForcedWithdrawalForm()
  initFreezeRequestForm()
  initVerifyEscapeForm()
}
