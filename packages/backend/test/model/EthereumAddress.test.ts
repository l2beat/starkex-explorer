import { expect } from 'chai'

import { EthereumAddress } from '../../src/model'

describe('EthereumAddress', () => {
  it('accepts lowercase addresses', () => {
    const address = EthereumAddress(
      '0xabcdabcd12345678abcdabcd12345678abcdabcd'
    )
    expect(address).to.be.a('string')
  })

  it('accepts addresses with checksum', () => {
    const address = EthereumAddress(
      '0xAbCdABCd12345678abcDabCd12345678ABcdaBcd'
    )
    expect(address).to.be.a('string')
  })

  it('checks the checksum', () => {
    expect(() =>
      EthereumAddress('0xAbCdABCd12345678abcDabCd12345678ABcdaBcD')
    ).to.throw(TypeError, 'Invalid EthereumAddress')
  })

  it('does not accept invalid strings', () => {
    expect(() => EthereumAddress('foo')).to.throw(
      TypeError,
      'Invalid EthereumAddress'
    )
  })

  it('converts to a representation with a checksum', () => {
    const address = EthereumAddress(
      '0xabcdabcd12345678abcdabcd12345678abcdabcd'
    )
    expect(address).to.eq(
      '0xAbCdABCd12345678abcDabCd12345678ABcdaBcd' as unknown as EthereumAddress
    )
  })

  describe('isBefore', () => {
    it('checks ordering', () => {
      const a = EthereumAddress('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
      const b = EthereumAddress('0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb')
      expect(EthereumAddress.isBefore(a, b)).to.eq(true)
      expect(EthereumAddress.isBefore(b, a)).to.eq(false)
      expect(EthereumAddress.isBefore(a, a)).to.eq(false)
    })

    it('works for WETH & USDT', () => {
      const weth = EthereumAddress('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')
      const usdt = EthereumAddress('0xdAC17F958D2ee523a2206206994597C13D831ec7')
      expect(EthereumAddress.isBefore(weth, usdt)).to.eq(true)
      expect(EthereumAddress.isBefore(usdt, weth)).to.eq(false)
    })
  })

  it('ZERO is the zero address', () => {
    expect(EthereumAddress.ZERO).to.eq(
      ('0x' + '0'.repeat(40)) as unknown as EthereumAddress
    )
  })
})
