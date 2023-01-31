import { EthereumAddress } from '@explorer/types'
import { ethers } from 'ethers'

import { provider } from './provider'

export const getERC20Info = async (address: EthereumAddress) => {
  const abi = [
    'function name() public view returns (string)',
    'function symbol() public view returns (string)',
    'function decimals() public view returns (uint8)',
  ]

  const contract = new ethers.Contract(address.toString(), abi, provider)

  //TODO: Do something about the unsafe calls and assignments

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
  const name: string = await contract.name()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const symbol: string = await contract.symbol()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const decimals: number = await contract.decimals()

  return {
    name,
    symbol,
    decimals,
  }
}
