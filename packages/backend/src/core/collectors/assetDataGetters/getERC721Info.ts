import { EthereumAddress } from '@explorer/types'
import { ethers } from 'ethers'

import { contractMethodWrapper } from './contractMethodWrapper'
import { provider } from './provider'

export const getERC721Info = async (address: EthereumAddress) => {
  const abi = [
    'function name() external view returns (string _name)',
    'function symbol() external view returns (string _symbol)',
  ]

  const contract = new ethers.Contract(address.toString(), abi, provider)

  //TODO: Handle multiple contract errors

  const {value: name} = await contractMethodWrapper<string>(contract, 'name')
  const {value: symbol} = await contractMethodWrapper<string>(contract, 'symbol')

  return {
    name,
    symbol,
    contractError: null,
  }
}
