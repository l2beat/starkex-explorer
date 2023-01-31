import { EthereumAddress } from '@explorer/types'
import { ethers } from 'ethers'

import { provider } from './provider'

export const getERC721Info = async (
  address: EthereumAddress,
  tokenId?: bigint
) => {
  const abi = [
    'function name() external view returns (string _name)',
    'function symbol() external view returns (string _symbol)',
    'function tokenURI(uint256 _tokenId) external view returns (string)',
  ]

  const contract = new ethers.Contract(address.toString(), abi, provider)

  //TODO: Do something about the unsafe calls and assignments

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
  const name: string = await contract.name()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const symbol: string = await contract.symbol()

  const base = {
    name, 
    symbol,
    contract_error: null
  }
  
  if(!tokenId) {
    return base
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const uri: string = await contract.tokenURI(tokenId)

  return {
    name,
    symbol,
    uri,
    contract_error: null
  }
}
