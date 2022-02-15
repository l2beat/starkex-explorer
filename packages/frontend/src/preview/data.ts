import { PedersenHash } from '@explorer/crypto'

import { HomeProps } from '../pages/home/HomeProps'

const ONE_HOUR = 60 * 60 * 1000

export const HOME_PROPS: HomeProps = {
  stateUpdates: Array.from({ length: 6 }).map((_, i) => ({
    hash: PedersenHash.fake(),
    positionCount: Math.floor(Math.random() * 30 + 4),
    timestamp:
      Date.now() - Math.floor(i * 6 * ONE_HOUR + Math.random() * 2 * ONE_HOUR),
  })),
  forcedTransaction: Array.from({ length: 6 }).map((_, i) => ({
    hash: PedersenHash.fake().toString(),
    valueUSDCents: Math.floor(Math.random() * 20000_00 + 5000_00),
    type: Math.random() > 0.3 ? 'exit' : 'trade',
    timestamp:
      Date.now() - Math.floor(i * 6 * ONE_HOUR + Math.random() * 2 * ONE_HOUR),
  })),
}
