import { EthereumAddress } from '@explorer/types'
import { AcceptedData } from './AcceptedData'
import { CollateralAsset } from './CollateralAsset'
import { CreateOfferData } from './CreateOfferData'

export interface AcceptOfferFormData extends CreateOfferData, AcceptedData {
  id: number
  address: EthereumAddress
  collateralAsset: CollateralAsset
}
