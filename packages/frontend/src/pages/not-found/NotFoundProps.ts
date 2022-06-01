import { AccountDetails } from '../common/AccountDetails'

export interface NotFoundProps {
  readonly account: AccountDetails | undefined
  readonly text: string
}
