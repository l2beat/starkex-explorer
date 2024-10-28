import { State } from '@explorer/encoding'
import { MerkleProof, PositionLeaf } from '@explorer/state'

const FXP_BITS = 32n

export function calculatePositionValue(
  merkleProof: MerkleProof<PositionLeaf>,
  state: State
): { fundingPayments: Record<string, bigint>; positionValue: bigint } {
  const position = merkleProof.leaf
  const fundingPayments: Record<string, bigint> = {}
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
    const fundingPayment =
      asset.balance * (asset.fundingIndex - fundingIndex.value)

    // Find the current price for this asset
    const priceData = state.oraclePrices.find(
      (price) => price.assetId === asset.assetId
    )
    if (!priceData) {
      throw new Error(`Price not found for asset ${asset.assetId.toString()}`)
    }

    // Update the balance based on asset value and funding
    fxpBalance += asset.balance * priceData.price + fundingPayment

    // Store funding payment for this asset
    fundingPayments[asset.assetId.toString()] = fundingPayment >> FXP_BITS
  }

  return {
    fundingPayments,
    positionValue: fxpBalance >> FXP_BITS,
  }
}
