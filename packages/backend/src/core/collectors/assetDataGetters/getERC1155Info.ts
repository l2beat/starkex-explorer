import { EthereumAddress } from '@explorer/types'
import { ethers } from 'ethers'

import { provider } from './provider'

export const getERC1155Info = async (
  address: EthereumAddress,
  tokenId: bigint
) => {
  const abi = [
    'function uri(uint256 _id) external view returns (string memory)',
  ]

  const contract = new ethers.Contract(address.toString(), abi, provider)

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
  const uri: string = await contract.uri(tokenId)

  return {
    uri,
    contractError: null
  }
}
