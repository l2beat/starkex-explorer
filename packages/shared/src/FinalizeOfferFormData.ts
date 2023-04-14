import { EthereumAddress } from '@explorer/types'

import { CollateralAsset } from './CollateralAsset'
import { FinalizeOfferData } from './FinalizeOfferData'

export interface FinalizeOfferFormData extends FinalizeOfferData {
  offerId: number
  address: EthereumAddress
  perpetualAddress: EthereumAddress
  collateralAsset: CollateralAsset
}
