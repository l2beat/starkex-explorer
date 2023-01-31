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

  // Only the uri available here but it needs the tokenId which we don't have a this point. Can we call uri without? What do we want to do?

  return {
    name: 'Unknown NFT token',
    symbol: '?',
    decimals: 0,
    uri,
  }
}
