export interface PositionDetailsProps {
  readonly positionId: bigint
  readonly publicKey: string
  readonly totalUSDCents: bigint
  readonly assets: ReadonlyArray<{
    readonly assetId: string
    readonly balance: bigint
    readonly totalUSDCents: bigint
  }>
  readonly history: ReadonlyArray<{
    readonly stateUpdateId: number
    readonly publicKey: string
    readonly collateralBalance: bigint
    readonly balances: ReadonlyArray<{
      readonly assetId: string
      readonly balance: bigint
    }>
  }>
}
