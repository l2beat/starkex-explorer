import { expect } from 'earljs'
import { BigNumber } from 'ethers'

import { EthereumEvent } from './EthereumEvent'

describe(EthereumEvent.name, () => {
  const TransferEvent = EthereumEvent<
    'Transfer',
    { from: string; to: string; value: BigNumber }
  >('event Transfer(address indexed from, address indexed to, uint value)')

  it('parses logs', () => {
    expect(TransferEvent.topic).toEqual(
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
    )

    const encoded = TransferEvent.encodeLog([
      '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      '0x41626BA92c0C2a1aD38fC83920300434082B1870',
      BigNumber.from(42069),
    ])

    const event = TransferEvent.parseLog(encoded)

    expect(event.name).toEqual('Transfer')
    expect(event.args.from).toEqual(
      '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
    )
    expect(event.args.to).toEqual('0x41626BA92c0C2a1aD38fC83920300434082B1870')
    expect(event.args.value).toEqual(BigNumber.from(42069))
  })

  it('throws for unknown logs', () => {
    expect(() =>
      TransferEvent.parseLog({
        topics: [],
        data: '0x',
      })
    ).toThrow()
  })

  it('can return undefined for unknown logs', () => {
    expect(
      TransferEvent.safeParseLog({
        topics: [],
        data: '0x',
      })
    ).toEqual(undefined)
  })
})
