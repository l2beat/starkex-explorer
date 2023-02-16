import { EthereumAddress } from '@explorer/types'

export interface AccountDetails {
  address: EthereumAddress
  positionId?: bigint
  hasUpdates?: boolean
}
