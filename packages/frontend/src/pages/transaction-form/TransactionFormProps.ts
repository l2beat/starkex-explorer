import { AssetId, EthereumAddress, StarkKey } from '@explorer/types'

import { PositionAssetEntry } from '../positions'

export interface TransactionFormProps {
  readonly account: EthereumAddress
  readonly perpetualAddress: EthereumAddress
  readonly selectedAsset: AssetId
  readonly positionId: bigint
  readonly publicKey: StarkKey
  readonly assets: readonly PositionAssetEntry[]
}
