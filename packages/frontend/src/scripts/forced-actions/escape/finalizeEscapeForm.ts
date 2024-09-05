import { UserDetails } from '@explorer/shared'
import { Hash256 } from '@explorer/types'

import {
  FINALIZE_ESCAPE_FORM_ID,
  FinalizeEscapeFormProps,
} from '../../../view/pages/user/components/FinalizeEscapeForm'
import { Api } from '../../peripherals/api'
import { Wallet } from '../../peripherals/wallet'
import { makeQuery } from '../../utils/query'
import { showSpinner } from '../../utils/showSpinner'

export function initFinalizeEscapeForm() {
  const { $ } = makeQuery(document.body)

  const form = $.maybe(`#${FINALIZE_ESCAPE_FORM_ID}`)
  if (!form) {
    return
  }
  const { $: form$ } = makeQuery(form)
  const button = form$('button')
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const propsJson = JSON.parse(form.dataset.props ?? '{}')
  const props = FinalizeEscapeFormProps.parse(propsJson)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const userJson = JSON.parse(form.dataset.user ?? '{}')
  const user = UserDetails.parse(userJson)
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    await showSpinner(button, async () => {
      await submitFinalizeEscape(props, user)
    })
  })
}

async function submitFinalizeEscape(
  props: FinalizeEscapeFormProps,
  user: UserDetails
) {
  const hash = await Wallet.sendFinalizeEscapeTransaction(user.address, props)

  await submitTransaction(props.tradingMode, hash)
  window.location.href = `/transactions/${hash.toString()}`
}

async function submitTransaction(
  tradingMode: FinalizeEscapeFormProps['tradingMode'],
  hash: Hash256
) {
  switch (tradingMode) {
    case 'perpetual':
      return Api.submitPerpetualFinalizeEscape(hash)
    case 'spot':
      return Api.submitSpotFinalizeEscape(hash)
  }
}
