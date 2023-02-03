import { EthereumAddress } from '@explorer/types'
import { utils } from 'ethers'

import { EthereumClient } from '../peripherals/ethereum/EthereumClient'

interface TokenInfo {
  name?: string
  symbol?: string
  decimals?: number
  errors: unknown[]
}

export class TokenInspector {
  constructor(private ethereumClient: EthereumClient) {}

  async inspect(address: EthereumAddress): Promise<TokenInfo> {
    const [name, e1] = await this.call<string>(
      address,
      'name',
      'function name() view returns (string)'
    )
    const [symbol, e2] = await this.call<string>(
      address,
      'symbol',
      'function symbol() view returns (string)'
    )
    const [decimals, e3] = await this.call<number>(
      address,
      'decimals',
      'function decimals() view returns (uint8)'
    )

    return {
      name,
      symbol,
      decimals,
      errors: [e1, e2, e3].filter((e) => e !== undefined),
    }
  }

  private async call<T>(
    address: EthereumAddress,
    name: string,
    abi: string,
    args: unknown[] = []
  ): Promise<[T | undefined, unknown]> {
    const coder = new utils.Interface([abi])
    const encoded = coder.encodeFunctionData(name, args)

    try {
      const result = await this.ethereumClient.call(address, encoded)
      try {
        const decodedName = coder.decodeFunctionResult(name, result)
        return [decodedName[0] as T, undefined]
      } catch (e) {
        return [undefined, e]
      }
    } catch (e) {
      if (!isRevert(e)) {
        throw e
      } else {
        return [undefined, e]
      }
    }
  }
}

function isRevert(e: unknown) {
  return e instanceof Error && e.message.includes('revert')
}
