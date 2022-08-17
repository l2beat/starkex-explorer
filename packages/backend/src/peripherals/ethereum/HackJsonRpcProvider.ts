import { providers, utils } from 'ethers'

import { BlockTag } from './types'

export type HackFilter = HackFromToFilter | HackBlockHashFilter

export interface HackFromToFilter {
  address?: string | string[]
  topics?: (string | string[] | null)[]
  fromBlock?: BlockTag
  toBlock?: BlockTag
}

export interface HackBlockHashFilter {
  address?: string | string[]
  topics?: (string | string[] | null)[]
  blockHash?: string
}

interface FilterByBlockHash {
  address?: string
  topics?: (string | string[] | null)[]
  blockHash?: string
}

type RegularFilter = providers.Filter | FilterByBlockHash

/**
 * It's only difference with JsonRpcProvider is accepting an array of addresses
 * in the logs filter.
 */
export class HackJsonRpcProvider extends providers.JsonRpcProvider {
  getLogs(filter: HackFilter | Promise<HackFilter>) {
    return super.getLogs(filter as RegularFilter | Promise<RegularFilter>)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prepareRequest(method: string, params: any): [string, any[]] {
    if (method === 'getLogs') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const filter = params.filter as HackFilter
      if (typeof filter.address === 'string') {
        filter.address = filter.address.toLowerCase()
      } else if (Array.isArray(filter.address)) {
        filter.address = filter.address.map((x) => x.toLowerCase())
      }
      return ['eth_getLogs', [filter]]
    }
    return super.prepareRequest(method, params)
  }

  async _getFilter(
    filter: RegularFilter | Promise<RegularFilter>
  ): Promise<RegularFilter> {
    const awaited = await filter
    if (Array.isArray(awaited.address)) {
      const addresses = awaited.address.map((x: string) => utils.getAddress(x))
      awaited.address = undefined
      const processed = await super._getFilter(awaited)
      return { ...processed, address: addresses as unknown as string }
    }
    return super._getFilter(awaited)
  }
}
