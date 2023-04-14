import { AssetHash } from '@explorer/types'

import { NewForcedActionFormProps } from '../../../view/pages/forced-actions/NewForcedActionFormProps'
import { SpotForcedWithdrawalFormId } from '../../../view/pages/forced-actions/NewSpotForcedWithdrawalPage'
import { Api } from '../../peripherals/api'
import { Wallet } from '../../peripherals/wallet'

export function initSpotForcedWithdrawalForm() {
  const form = document.getElementById(SpotForcedWithdrawalFormId)
  if (!form) {
    return
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const propsJson = JSON.parse(form.dataset.props ?? '{}')
  const props = NewForcedActionFormProps.parse(propsJson)
  if (!AssetHash.check(props.asset.hashOrId.toString())) {
    throw new Error('Invalid asset hash')
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    submitExit(props).catch(console.error)
  })
}

async function submitExit(props: NewForcedActionFormProps) {
  const hash = await Wallet.sendSpotForcedWithdrawalTransaction(
    props.context.user.address,
    props.starkKey,
    props.positionOrVaultId,
    props.starkExAddress
  )

  await Api.submitSpotForcedWithdrawal(hash)
  window.location.href = `/transactions/${hash.toString()}`
}
