import { UserDetails } from '@explorer/shared'

import {
  VERIFY_ESCAPE_REQUEST_FORM_ID,
  VerifyEscapeFormProps,
} from '../../../view'
import { Api } from '../../peripherals/api'
import { Wallet } from '../../peripherals/wallet'
import { makeQuery } from '../../utils/query'

export function initVerifyEscapeForm() {
  const { $ } = makeQuery(document.body)

  const form = $.maybe(`#${VERIFY_ESCAPE_REQUEST_FORM_ID}`)
  if (!form) {
    return
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const propsJson = JSON.parse(form.dataset.props ?? '{}')
  const props = VerifyEscapeFormProps.parse(propsJson)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const userJson = JSON.parse(form.dataset.user ?? '{}')
  const user = UserDetails.parse(userJson)
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    submitVerifyEscape(props, user).catch(console.error)
  })
}

async function submitVerifyEscape(
  props: VerifyEscapeFormProps,
  user: UserDetails
) {
  const hash = await Wallet.sendVerifyEscapeTransaction(
    user.address,
    props.serializedMerkleProof,
    props.assetCount,
    props.serializedState,
    props.escapeVerifierAddress
  )

  await Api.submitVerifyEscape(
    hash,
    props.starkKey,
    props.positionOrVaultId.toString()
  )
  window.location.href = `/transactions/${hash}`
}
