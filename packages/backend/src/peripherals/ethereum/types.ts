export type BlockNumber = number
export type BlockTag = BlockNumber | 'earliest' | 'latest' | 'pending'

/**
 * inclusive on both sides
 */
export type BlockRange = {
  readonly from: BlockNumber
  readonly to: BlockNumber
}
