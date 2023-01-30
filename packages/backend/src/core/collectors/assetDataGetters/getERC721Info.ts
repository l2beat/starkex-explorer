import { EthereumAddress } from '@explorer/types'
import { ethers } from 'ethers'

import { provider } from './provider'

export const getERC721Info = async (address: EthereumAddress) => {
  const abi = [
    'function name() external view returns (string _name)',
    'function symbol() external view returns (string _symbol)',
  ]

  const contract = new ethers.Contract(address.toString(), abi, provider)

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
  const name: string = await contract.name()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const symbol: string = await contract.symbol()

  return {
    name,
    symbol,
    decimals: 0,
  }
}
