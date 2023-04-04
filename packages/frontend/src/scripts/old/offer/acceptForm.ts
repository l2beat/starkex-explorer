import {
  deserializeAcceptedData,
  deserializeCollateralAsset,
  deserializeCreateOfferData,
} from '@explorer/shared'
import { EthereumAddress } from '@explorer/types'

// eslint-disable-next-line no-restricted-imports
import { FormClass } from '../../../view/old/offers/accept-form/attributes'
import { Api } from '../../peripherals/api'
import { Wallet } from '../../peripherals/wallet'
import { getAttribute } from './getAttribute'

export function initAcceptOfferForm() {
  const forms = document.querySelectorAll<HTMLFormElement>(`.${FormClass}`)
  forms.forEach((form) => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      const address = EthereumAddress(getAttribute(form, 'address'))
      const offer = deserializeCreateOfferData(getAttribute(form, 'offer'))
      const offerId = Number(getAttribute(form, 'offer-id'))
      const accepted = deserializeAcceptedData(getAttribute(form, 'accepted'))
      const collateralAsset = deserializeCollateralAsset(
        getAttribute(form, 'collateralAsset')
      )
      const signature = await Wallet.signAccepted(
        address,
        offer,
        accepted,
        collateralAsset
      )
      await Api.acceptOffer(offerId, accepted, signature)
      window.location.reload()
    })
  })
}
