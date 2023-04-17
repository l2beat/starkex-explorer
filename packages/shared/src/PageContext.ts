import { CollateralAsset } from './CollateralAsset'
import { InstanceName } from './InstanceName'
import { UserDetails } from './UserDetails'

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

export type PageContext<
  T extends PerpetualPageContext | SpotPageContext =
    | PerpetualPageContext
    | SpotPageContext
> = T

export type PageContextWithUser<
  T extends PerpetualPageContext | SpotPageContext =
    | PerpetualPageContext
    | SpotPageContext
> = PageContext<T> & {
  user: UserDetails
}

export type PageContextWithUserAndStarkKey<
  T extends PerpetualPageContext | SpotPageContext =
    | PerpetualPageContext
    | SpotPageContext
> = T & {
  user: Required<UserDetails>
}
