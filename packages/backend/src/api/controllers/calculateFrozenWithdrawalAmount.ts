import { State } from '@explorer/encoding'
import { MerkleProof, PositionLeaf } from '@explorer/state'

const FXP_BITS = 32n

/**
 * Calculates the frozen withdrawal amount for a position
 */
export function calculateEscapePerpetualWithdrawalAmount(
  merkleProof: MerkleProof<PositionLeaf>,
  state: State,
  ignoreFunding = false
): bigint {
  const position = merkleProof.leaf
  let fxpBalance = position.collateralBalance << FXP_BITS

  // For each asset in the position
  for (const asset of position.assets) {
    // Find the current funding index for this asset
    const fundingIndex = state.indices.find(
      (idx) => idx.assetId === asset.assetId
    )
    if (!fundingIndex) {
      throw new Error(
        `Funding index not found for asset ${asset.assetId.toString()}`
      )
    }

    // Calculate funding payment
    const fundingPayment = ignoreFunding
      ? 0n
      : asset.balance * (fundingIndex.value - asset.fundingIndex)

    // Find the current price for this asset
    const priceData = state.oraclePrices.find(
      (price) => price.assetId === asset.assetId
    )
    if (!priceData) {
      throw new Error(`Price not found for asset ${asset.assetId.toString()}`)
    }

    // Update the balance based on asset value and funding
    fxpBalance += asset.balance * priceData.price - fundingPayment
  }

  // Convert from fixed-point to regular number
  return fxpBalance >> FXP_BITS
}
