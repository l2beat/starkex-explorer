export type {
  Block,
  Filter,
  FilterByBlockHash,
  Log,
} from '@ethersproject/abstract-provider'
export { BigNumber } from 'ethers'

export type BlockNumber = number
export type BlockTag = BlockNumber | 'earliest' | 'latest' | 'pending'
export type BlockRange = {
  readonly from: BlockNumber
  readonly to: BlockNumber
}
