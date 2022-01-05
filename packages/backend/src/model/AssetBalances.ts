interface AssetBalance {
  assetId: string
  balance: bigint
}

export class AssetBalances extends Array<AssetBalance> {
  stringify(): AssetBalances.Json {
    const stringifiedBigints = this.map((x) => ({
      assetId: x.assetId,
      balance: x.balance.toString(),
    }))

    return JSON.stringify(stringifiedBigints) as unknown as AssetBalances.Json
  }

  static parse(
    json: AssetBalances.Json | AssetBalanceStringified[]
  ): AssetBalances {
    const parsed = Array.isArray(json)
      ? json
      : (JSON.parse(json) as AssetBalanceStringified[])

    const parsedBigints = parsed.map((x) => ({
      assetId: x.assetId,
      balance: BigInt(x.balance),
    }))

    return AssetBalances.from(parsedBigints)
  }

  static from: (xs: ArrayLike<AssetBalance>) => AssetBalances
}

export declare namespace AssetBalances {
  export type Json = string & {
    readonly _assetBalancesJsonBrand: unique symbol
  }
}

interface AssetBalanceStringified {
  assetId: string
  balance: string
}
