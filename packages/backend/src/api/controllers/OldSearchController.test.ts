import { EthereumAddress, PedersenHash, StarkKey } from '@explorer/types'
import { expect } from 'earl'

import { parseSearchQuery } from './OldSearchController'

describe(parseSearchQuery.name, () => {
  it('parses ethereum address', () => {
    const ethAddress = EthereumAddress.fake().toString()

    const result = parseSearchQuery(ethAddress)

    expect(result).toEqual({
      ethereumAddress: EthereumAddress(ethAddress),
      starkKey: undefined,
      stateTreeHash: PedersenHash(ethAddress),
    })
  })

  it('parses stark key look alike', () => {
    const starkKeyLike =
      '0x030cbffc660a577c9ea2c06d8a3a7f7389aca2d4b40e2b7127419461b6d98268'

    const result = parseSearchQuery(starkKeyLike)

    expect(result).toEqual({
      stateTreeHash: PedersenHash(starkKeyLike),
      starkKey: StarkKey(starkKeyLike),
      ethereumAddress: undefined,
    })
  })
})
