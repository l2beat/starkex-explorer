import { initFreezeRequestForm } from './escape/freezeRequestForm'
import { initPerpetualForcedActionForm } from './perpetual/perpetualForcedActionForm'
import { initSpotForcedWithdrawalForm } from './spot/spotForcedWithdrawalForm'

export function initForcedActionForms() {
  initPerpetualForcedActionForm()
  initSpotForcedWithdrawalForm()
  initFreezeRequestForm()
}
