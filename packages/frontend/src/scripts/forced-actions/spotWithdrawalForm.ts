import { AssetHash } from '@explorer/types'
import { NewForcedActionFormProps } from '../../view/pages/forced-actions/NewForcedActionFormProps'
import { SpotWithdrawalFormId } from '../../view/pages/forced-actions/NewSpotForcedWithdrawalPage'

export function initSpotWithdrawalForm() {
  const form = document.getElementById(SpotWithdrawalFormId)
  if (!form) {
    return
  }
  const propsJson = JSON.parse(form.dataset.props ?? '{}')
  const props = NewForcedActionFormProps.parse(propsJson)
  const assetHash = AssetHash(props.asset.hashOrId.toString())
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    alert('Spot withdrawal - mock submit: ' + assetHash.toString())
  })
}
