import { BigNumber } from 'ethers'

export function toHexData(input: BigNumber[]) {
  return input
    .map((x) => x.toHexString().substring(2).padStart(64, '0'))
    .join('')
}
