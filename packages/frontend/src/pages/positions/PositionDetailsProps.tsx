export interface PositionDetailsProps {
  readonly positionId: bigint
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
