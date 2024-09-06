import { UserDetails } from '@explorer/shared'

import {
  VERIFY_ESCAPE_REQUEST_FORM_ID,
  VerifyEscapeFormProps,
} from '../../../view'
import { Api } from '../../peripherals/api'
import { Wallet } from '../../peripherals/wallet'
import { makeQuery } from '../../utils/query'
import { showSpinner } from '../../utils/showSpinner'

export function initVerifyEscapeForm() {
  const { $ } = makeQuery(document.body)

  const form = $.maybe(`#${VERIFY_ESCAPE_REQUEST_FORM_ID}`)
  if (!form) {
    return
  }
  const { $: form$ } = makeQuery(form)
  const button = form$('button')
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const propsJson = JSON.parse(form.dataset.props ?? '{}')
  const props = VerifyEscapeFormProps.parse(propsJson)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const userJson = JSON.parse(form.dataset.user ?? '{}')
  const user = UserDetails.parse(userJson)
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    await showSpinner(button, async () => {
      await submitVerifyEscape(props, user)
    })
  })
}

async function submitVerifyEscape(
  props: VerifyEscapeFormProps,
  user: UserDetails
) {
  const hash = await Wallet.sendVerifyEscapeTransaction(user.address, props)

  await Api.submitVerifyEscape(
    hash,
    props.starkKey,
    props.positionOrVaultId.toString()
  )
  window.location.href = `/transactions/${hash.toString()}`
}
