import { EthereumAddress } from '@explorer/types'

import { EthereumClient } from '../../../peripherals/ethereum/EthereumClient'
import { contractMethodWrapper } from './contractMethodWrapper'

export const getERC721Info = async (
  ethereumClient: EthereumClient,
  address: EthereumAddress
) => {
  const abi = [
    'function name() external view returns (string _name)',
    'function symbol() external view returns (string _symbol)',
  ]

  const contract = ethereumClient.getContract(address.toString(), abi)

  //TODO: Handle multiple contract errors

  const { value: name } = await contractMethodWrapper<string>(contract, 'name')
  const { value: symbol } = await contractMethodWrapper<string>(
    contract,
    'symbol'
  )

  return {
    name,
    symbol,
    contractError: null,
  }
}
