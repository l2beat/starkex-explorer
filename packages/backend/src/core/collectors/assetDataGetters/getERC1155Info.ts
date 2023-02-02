import { EthereumAddress } from '@explorer/types'
import { ethers } from 'ethers'

import { contractMethodWrapper } from './contractMethodWrapper'
import { provider } from './provider'

export const getERC1155Info = async (
  address: EthereumAddress,
  tokenId: bigint
) => {
  const abi = [
    'function uri(uint256 _id) external view returns (string memory)',
  ]

  const contract = new ethers.Contract(address.toString(), abi, provider)

  const {value: uri, contractError} = await contractMethodWrapper<string>(contract, 'uri', tokenId)

  return {
    uri,
    contractError
  }
}
