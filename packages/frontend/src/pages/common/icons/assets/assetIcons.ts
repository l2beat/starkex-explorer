import { BtcIcon } from './BtcIcon'
import { EthIcon } from './EthIcon'
import { LinkIcon } from './LinkIcon'
import { MkrIcon } from './MkrIcon'
import { UsdcIcon } from './UsdcIcon'

export const assetIcons: Record<
  string,
  (props: React.SVGProps<SVGSVGElement>) => JSX.Element
> = {
  ETH: EthIcon,
  BTC: BtcIcon,
  USDC: UsdcIcon,
  MKR: MkrIcon,
  LINK: LinkIcon,
}
