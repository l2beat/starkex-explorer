import { initPerpetualForcedActionForm } from './perpetual/perpetualForcedActionForm'
import { initSpotForcedWithdrawalForm } from './spot/spotForcedWithdrawalForm'

export function initForcedActionForms() {
  initPerpetualForcedActionForm()
  initSpotForcedWithdrawalForm()
}
