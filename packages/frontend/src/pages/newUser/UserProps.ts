import { Timestamp } from "@explorer/types"

import { AccountDetails } from "../common/AccountDetails"

export interface UserProps {
    readonly account: AccountDetails | undefined
    readonly withdrawableAssets: readonly WithdrawableAssetEntry[]
    readonly offersToAccept: readonly OfferEntry[]
    readonly assets: readonly AssetEntry[]
    readonly totalAssets: bigint
    readonly balanceChanges: readonly BalanceChangeEntry[]
    readonly totalBalanceChanges: bigint
    readonly ethereumTransactions: readonly EthereumTransactionEntry[]
    readonly totalEthereumTransactions: bigint
    readonly offers: readonly OfferEntry[]
    readonly totalOffers: bigint
}

export interface WithdrawableAssetEntry {
    readonly icon: string
    readonly symbol: string
    readonly amount: bigint
}

export interface AssetEntry {
    readonly icon: string
    readonly name: string
    readonly symbol: string
    readonly balance: bigint
    readonly value: bigint
    readonly vaultId: number
    readonly action: "WITHDRAW" | "CLOSE"
}

export interface OfferEntry {
    readonly timestamp: Timestamp
    readonly asset: string
    readonly assetIcon: string
    readonly amount: bigint
    readonly price: bigint
    readonly status: "CREATED" | "ACCEPTED" | "SENT" | "CANCELLED" | "EXPIRED"
    readonly type: "BUY" | "SELL"
}

export interface BalanceChangeEntry {
    readonly timestamp: Timestamp
    readonly stateUpdateId: number
    readonly asset: string
    readonly assetIcon: string
    readonly newBalance: bigint
    readonly change: bigint
    readonly vaultId: number
}

export interface EthereumTransactionEntry {
    readonly timestamp: Timestamp
    readonly hash: string
    readonly asset: string
    readonly assetIcon: string
    readonly amount: bigint
    readonly status: "SENT (1/3)" | "MINED (2/3)" | "INCLUDED (3/3)" | "SENT (1/2)" | "MINED (2/2)" | "REVERTED"
    readonly type: "Forced withdrawal" | "Forced buy" | "Forced sell" | "Wtihdrawal"
}
