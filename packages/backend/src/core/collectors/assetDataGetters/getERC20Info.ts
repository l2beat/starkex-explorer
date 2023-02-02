import { EthereumAddress } from '@explorer/types'

import { EthereumClient } from '../../../peripherals/ethereum/EthereumClient'
import { contractMethodWrapper } from './contractMethodWrapper'

export const getERC20Info = async (
  ethereumClient: EthereumClient,
  address: EthereumAddress
) => {
  const abi = [
    'function name() public view returns (string)',
    'function symbol() public view returns (string)',
    'function decimals() public view returns (uint8)',
  ]

  const contract = ethereumClient.getContract(address.toString(), abi)

  //TODO: Handle multiple contract errors

  // let contractError = null

  const { value: name } = await contractMethodWrapper<string>(contract, 'name')
  const { value: symbol } = await contractMethodWrapper<string>(
    contract,
    'symbol'
  )
  const { value: decimals, contractError } =
    await contractMethodWrapper<number>(contract, 'decimals')

  return {
    name,
    symbol,
    decimals,
    contractError,
  }
}
