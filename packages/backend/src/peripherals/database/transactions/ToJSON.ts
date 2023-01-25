import { AssetId, EthereumAddress, StarkKey, Timestamp } from '@explorer/types'

type StringConvertible =
  | bigint
  | StarkKey
  | Timestamp
  | AssetId
  | EthereumAddress

export type ToJSON<T> = {
  [K in keyof T]: T[K] extends StringConvertible ? string : T[K]
}
