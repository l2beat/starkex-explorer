import { CollateralAsset } from './CollateralAsset'
import { InstanceName } from './InstanceName'
import { TradingMode } from './TradingMode'
import { UserDetails } from './UserDetails'

type CheckTradingMode<T extends { tradingMode: TradingMode }> = Exclude<
  T['tradingMode'],
  TradingMode
> extends never
  ? T
  : never

export interface PerpetualPageContext {
  user: UserDetails | undefined
  instanceName: InstanceName
  tradingMode: 'perpetual'
  collateralAsset: CollateralAsset
}

export interface SpotPageContext {
  user: UserDetails | undefined
  instanceName: InstanceName
  tradingMode: 'spot'
}

export type PageContext = CheckTradingMode<
  PerpetualPageContext | SpotPageContext
>

export type PageContextWithUser = CheckTradingMode<
  PageContext & {
    user: UserDetails
  }
>

export type PageContextWithUserAndStarkKey = CheckTradingMode<
  PageContextWithUser & {
    user: Required<UserDetails>
  }
>
