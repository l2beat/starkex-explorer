import { AccountDetails } from '../common/AccountDetails'

export interface NotFoundProps {
  readonly path: string
  readonly account: AccountDetails | undefined
  readonly text: string
}
