import {
  AssetHash,
  AssetId,
  EthereumAddress,
  Hash256,
  PedersenHash,
  StarkKey,
  Timestamp,
} from '@explorer/types'

type StringConvertible =
  | bigint
  | StarkKey
  | Timestamp
  | AssetId
  | EthereumAddress
  | AssetHash
  | PedersenHash
  | Hash256

export type ToJSON<T> = {
  [K in keyof T]: T[K] extends StringConvertible
    ? string
    : T[K] extends object
    ? ToJSON<T[K]>
    : T[K]
}
