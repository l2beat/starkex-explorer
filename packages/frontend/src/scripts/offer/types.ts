import { StarkKey } from '@explorer/types'

export interface AcceptedData {
  starkKeyB: StarkKey
  positionIdB: bigint
  nonce: bigint
  submissionExpirationTime: bigint
  premiumCost: boolean
}
