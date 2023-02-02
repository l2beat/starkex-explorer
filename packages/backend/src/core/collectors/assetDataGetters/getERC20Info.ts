import { EthereumAddress } from '@explorer/types'
import { ethers } from 'ethers'

import { contractMethodWrapper } from './contractMethodWrapper'
import { provider } from './provider'

export const getERC20Info = async (address: EthereumAddress) => {
  const abi = [
    'function name() public view returns (string)',
    'function symbol() public view returns (string)',
    'function decimals() public view returns (uint8)',
  ]

  const contract = new ethers.Contract(address.toString(), abi, provider)

  //TODO: Handle multiple contract errors

  // let contractError = null

  const { value: name } = await contractMethodWrapper<string>(contract, 'name')
  const { value: symbol } = await contractMethodWrapper<string>(
    contract,
    'symbol'
  )
  const { value: decimals, contractError } =
    await contractMethodWrapper<number>(contract, 'decimals')

  return {
    name,
    symbol,
    decimals,
    contractError,
  }
}
