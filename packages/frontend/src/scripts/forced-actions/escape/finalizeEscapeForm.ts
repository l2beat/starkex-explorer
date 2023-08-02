import { UserDetails } from '@explorer/shared'

import { FINALIZE_ESCAPE_FORM_ID } from '../../../view'
import { FinalizeEscapeFormProps } from '../../../view/pages/user/components/FinalizeEscapeForm'
import { Api } from '../../peripherals/api'
import { Wallet } from '../../peripherals/wallet'
import { makeQuery } from '../../utils/query'

export function initFinalizeEscapeForm() {
  const { $ } = makeQuery(document.body)

  const form = $.maybe(`#${FINALIZE_ESCAPE_FORM_ID}`)
  if (!form) {
    return
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const propsJson = JSON.parse(form.dataset.props ?? '{}')
  const props = FinalizeEscapeFormProps.parse(propsJson)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const userJson = JSON.parse(form.dataset.user ?? '{}')
  const user = UserDetails.parse(userJson)
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    submitFinalizeEscape(props, user).catch(console.error)
  })
}

async function submitFinalizeEscape(
  props: FinalizeEscapeFormProps,
  user: UserDetails
) {
  const hash = await Wallet.sendFinalizeEscapeTransaction(
    user.address,
    props.ownerStarkKey,
    props.positionOrVaultId,
    props.amount,
    props.exchangeAddress
  )

  await Api.submitFinalizeEscape(hash)
  window.location.href = `/transactions/${hash.toString()}`
}
