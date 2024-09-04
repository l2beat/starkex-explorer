import { UserDetails } from '@explorer/shared'
import { Hash256 } from '@explorer/types'

import {
  FREEZE_REQUEST_FORM_ID,
  FreezeRequestActionFormProps,
} from '../../../view'
import { Api } from '../../peripherals/api'
import { Wallet } from '../../peripherals/wallet'
import { makeQuery } from '../../utils/query'

export function initFreezeRequestForm() {
  const { $ } = makeQuery(document.body)

  const form = $.maybe(`#${FREEZE_REQUEST_FORM_ID}`)
  if (!form) {
    return
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const propsJson = JSON.parse(form.dataset.props ?? '{}')
  const props = FreezeRequestActionFormProps.parse(propsJson)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const userJson = JSON.parse(form.dataset.user ?? '{}')
  const user = UserDetails.parse(userJson)
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    submitFreezeRequest(props, user).catch(console.error)
  })
}

async function submitFreezeRequest(
  props: FreezeRequestActionFormProps,
  user: UserDetails
) {
  const hash = await Wallet.sendFreezeRequestTransaction(user.address, props)

  await submitTransaction(props.type, hash)
  window.location.href = `/transactions/${hash.toString()}`
}

async function submitTransaction(
  txType: FreezeRequestActionFormProps['type'],
  txHash: Hash256
) {
  switch (txType) {
    case 'ForcedTrade':
      return Api.submitForcedTradeFreezeRequest(txHash)
    case 'ForcedWithdrawal':
      return Api.submitForcedWithdrawalFreezeRequest(txHash)
    case 'FullWithdrawal':
      return Api.submitFullWithdrawalFreezeRequest(txHash)
  }
}
