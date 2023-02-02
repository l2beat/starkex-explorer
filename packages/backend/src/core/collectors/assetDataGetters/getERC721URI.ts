import { EthereumAddress } from '@explorer/types'

import { EthereumClient } from '../../../peripherals/ethereum/EthereumClient'
import { contractMethodWrapper } from './contractMethodWrapper'

export const getERC721URI = async (
  ethereumClient: EthereumClient,
  address: EthereumAddress,
  tokenId: bigint
) => {
  const abi = [
    'function tokenURI(uint256 _tokenId) external view returns (string)',
  ]

  const contract = ethereumClient.getContract(address.toString(), abi)

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
