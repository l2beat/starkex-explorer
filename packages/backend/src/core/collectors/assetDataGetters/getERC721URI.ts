import { EthereumAddress } from '@explorer/types'
import { ethers } from 'ethers'

import { contractMethodWrapper } from './contractMethodWrapper'
import { provider } from './provider'

export const getERC721URI = async (
  address: EthereumAddress,
  tokenId: bigint
) => {
  const abi = [
    'function tokenURI(uint256 _tokenId) external view returns (string)',
  ]

  const contract = new ethers.Contract(address.toString(), abi, provider)

  const { value: uri, contractError } = await contractMethodWrapper<string>(
    contract,
    'tokenURI',
    tokenId
  )

  return {
    uri,
    contractError,
  }
}
