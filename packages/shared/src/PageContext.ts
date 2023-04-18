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

interface PerpetualPageContext {
  user: UserDetails | undefined
  instanceName: InstanceName
  tradingMode: 'perpetual'
  collateralAsset: CollateralAsset
}

interface SpotPageContext {
  user: UserDetails | undefined
  instanceName: InstanceName
  tradingMode: 'spot'
}

export type PageContext<T extends TradingMode = TradingMode> = CheckTradingMode<
  T extends 'perpetual'
    ? PerpetualPageContext
    : T extends 'spot'
    ? SpotPageContext
    : PerpetualPageContext | SpotPageContext
>

export type PageContextWithUser<T extends TradingMode = TradingMode> =
  CheckTradingMode<
    PageContext<T> & {
      user: UserDetails
    }
  >

export type PageContextWithUserAndStarkKey<
  T extends TradingMode = TradingMode
> = CheckTradingMode<
  PageContextWithUser<T> & {
    user: Required<UserDetails>
  }
>
