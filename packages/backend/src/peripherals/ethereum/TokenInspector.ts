import { EthereumAddress } from '@explorer/types'
import { utils } from 'ethers'

import { EthereumClient } from './EthereumClient'

interface ERC20Info {
  name: string | null
  symbol: string | null
  decimals: number | null
  contractError: unknown[]
}

interface ERC721Info {
  name: string | null
  symbol: string | null
  contractError: unknown[]
}

interface ERC721URI {
  uri: string | null
  contractError: unknown[]
}

interface ERC1155URI {
  uri: string | null
  contractError: unknown[]
}

export class TokenInspector {
  constructor(private ethereumClient: EthereumClient) {}

  async inspectERC20(address: EthereumAddress): Promise<ERC20Info> {
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
      contractError: [e1, e2, e3].filter((e) => e !== undefined),
    }
  }

  async inspectERC721(address: EthereumAddress): Promise<ERC721Info> {
    const [name, e1] = await this.call<string>(
      address,
      'name',
      'function name() external view returns (string _name)'
    )
    const [symbol, e2] = await this.call<string>(
      address,
      'symbol',
      'function symbol() external view returns (string _symbol)'
    )

    return {
      name,
      symbol,
      contractError: [e1, e2].filter((e) => e !== undefined),
    }
  }

  async getERC721URI(
    address: EthereumAddress,
    tokenId: bigint
  ): Promise<ERC721URI> {
    const [uri, e] = await this.call<string>(
      address,
      'tokenURI',
      'function tokenURI(uint256 _tokenId) external view returns (string)',
      [tokenId]
    )

    return {
      uri,
      contractError: e === undefined ? [] : [e],
    }
  }

  async getERC1155URI(
    address: EthereumAddress,
    tokenId: bigint
  ): Promise<ERC1155URI> {
    const [uri, e] = await this.call<string>(
      address,
      'uri',
      'function uri(uint256 _id) external view returns (string memory)',
      [tokenId]
    )

    return {
      uri,
      contractError: e === undefined ? [] : [e],
    }
  }

  private async call<T>(
    address: EthereumAddress,
    name: string,
    abi: string,
    args: unknown[] = []
  ): Promise<[T | null, unknown]> {
    const coder = new utils.Interface([abi])
    const encoded = coder.encodeFunctionData(name, args)

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = await this.ethereumClient.call(address, encoded)
      try {
        const decodedName = coder.decodeFunctionResult(name, result)
        return [decodedName[0] as T, undefined]
      } catch (e) {
        return [null, e]
      }
    } catch (e) {
      if (!isRevert(e)) {
        throw e
      } else {
        return [null, e]
      }
    }
  }
}

function isRevert(e: unknown) {
  return e instanceof Error && e.message.includes('revert')
}
