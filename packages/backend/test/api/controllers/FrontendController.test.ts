import { EthereumAddress, Hash256, PedersenHash } from '@explorer/types'
import { expect } from 'earljs'

import { parseSearchQuery } from '../../../src/api/controllers/FrontendController'

describe(parseSearchQuery.name, () => {
  it('parses ethereum address', () => {
    const ethAddress = '0xc730B028dA66EBB14f20e67c68DD809FBC49890D'

    const result = parseSearchQuery(ethAddress)

    expect(result).toEqual({ ethereumAddress: EthereumAddress(ethAddress) })
  })

  it('parses stark key look alike', () => {
    const starkKeyLike =
      '0x030cbffc660a577c9ea2c06d8a3a7f7389aca2d4b40e2b7127419461b6d98268'

    const result = parseSearchQuery(starkKeyLike)

    expect(result).toEqual({
      stateTreeHash: Hash256(starkKeyLike),
      starkKey: starkKeyLike,
    })
  })
})
