import { EthereumAddress } from '@explorer/types'

import { EthereumClient } from '../../../peripherals/ethereum/EthereumClient'
import { contractMethodWrapper } from './contractMethodWrapper'

export const getERC1155Info = async (
  ethereumClient: EthereumClient,
  address: EthereumAddress,
  tokenId: bigint
) => {
  const abi = [
    'function uri(uint256 _id) external view returns (string memory)',
  ]

  const contract = ethereumClient.getContract(address.toString(), abi)

  const { value: uri, contractError } = await contractMethodWrapper<string>(
    contract,
    'uri',
    tokenId
  )

  return {
    uri,
    contractError,
  }
}
