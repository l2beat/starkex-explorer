import { EthereumAddress } from '@explorer/types'
import { ethers } from 'ethers'

import { provider } from './provider'

export const getERC721URI = async (
  address: EthereumAddress,
  tokenId: bigint
) => {
  const abi = [
    'function tokenURI(uint256 _tokenId) external view returns (string)',
  ]

  const contract = new ethers.Contract(address.toString(), abi, provider)

  //TODO: Do something about the unsafe calls and assignments

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const uri: string = await contract.tokenURI(tokenId)

  return {
    uri,
    contractError: null,
  }
}
