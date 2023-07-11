import { EthereumAddress } from '@explorer/types'

import { EthereumClient } from './EthereumClient'

interface ERC20Info {
  name?: string
  symbol?: string
  decimals?: number
  contractError: unknown[]
}

interface ERC721Info {
  name?: string
  symbol?: string
  contractError: unknown[]
}

interface ERC721URI {
  uri?: string
  contractError: unknown[]
}

interface ERC1155URI {
  uri?: string
  contractError: unknown[]
}

export class TokenInspector {
  constructor(private ethereumClient: EthereumClient) {}

  async inspectERC20(address: EthereumAddress): Promise<ERC20Info> {
    const [name, e1] = await this.ethereumClient.call<string>(
      address,
      'name',
      'function name() view returns (string)'
    )
    const [symbol, e2] = await this.ethereumClient.call<string>(
      address,
      'symbol',
      'function symbol() view returns (string)'
    )
    const [decimals, e3] = await this.ethereumClient.call<number>(
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
    const [name, e1] = await this.ethereumClient.call<string>(
      address,
      'name',
      'function name() external view returns (string _name)'
    )
    const [symbol, e2] = await this.ethereumClient.call<string>(
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
    const [uri, e] = await this.ethereumClient.call<string>(
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
    const [uri, e] = await this.ethereumClient.call<string>(
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
}
