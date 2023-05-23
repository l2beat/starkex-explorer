import { UserDetails } from '@explorer/shared'
import { AssetHash } from '@explorer/types'

import { SPOT_FORCED_WITHDRAWAL_FORM_ID } from '../../../view'
import { NewSpotForcedActionFormProps } from '../../../view/pages/forced-actions/NewForcedActionFormProps'
import { Api } from '../../peripherals/api'
import { Wallet } from '../../peripherals/wallet'

export function initSpotForcedWithdrawalForm() {
  const form = document.getElementById(SPOT_FORCED_WITHDRAWAL_FORM_ID)
  if (!form) {
    return
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const propsJson = JSON.parse(form.dataset.props ?? '{}')
  const props = NewSpotForcedActionFormProps.parse(propsJson)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const userJson = JSON.parse(form.dataset.user ?? '{}')
  const user = UserDetails.parse(userJson)
  if (!AssetHash.check(props.asset.hashOrId.toString())) {
    throw new Error('Invalid asset hash')
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    submitExit(props, user).catch(console.error)
  })
}

async function submitExit(
  props: NewSpotForcedActionFormProps,
  user: UserDetails
) {
  const hash = await Wallet.sendSpotForcedWithdrawalTransaction(
    user.address,
    props.starkKey,
    props.positionOrVaultId,
    props.starkExAddress
  )

  await Api.submitSpotForcedWithdrawal(hash)
  window.location.href = `/transactions/${hash.toString()}`
}
