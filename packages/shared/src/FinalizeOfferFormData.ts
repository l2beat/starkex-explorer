import { EthereumAddress } from '@explorer/types'

import { FinalizeOfferData } from './FinalizeOfferData'

export interface FinalizeOfferFormData extends FinalizeOfferData {
  offerId: number
  address: EthereumAddress
  perpetualAddress: EthereumAddress
}
