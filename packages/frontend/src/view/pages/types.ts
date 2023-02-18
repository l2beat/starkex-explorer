import { AssetDetails } from '@explorer/shared'
import { AssetHash, AssetId } from '@explorer/types'

export interface Asset {
  hashOrId: AssetHash | AssetId
  details?: AssetDetails
}
