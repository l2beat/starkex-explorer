import { expect } from 'earl'

import {
  getGenericStarkExKeyPairFromData,
  getMyriaStarkExKeyPairFromData,
} from './keys'

describe(getGenericStarkExKeyPairFromData.name, () => {
  it('correctly calculates the keys for dydx', () => {
    const data = '0x12345678'
    const pair = getGenericStarkExKeyPairFromData(data)

    // Derived using:
    // const x = require('@dydxprotocol/starkex-lib')
    // const keyPair = x.keyPairFromData(Buffer.from('12345678', 'hex'))
    expect(pair).toEqual({
      publicKey:
        '00f7910c0a5a53a35344ee546546ef67763b166bd5fc0640d0faab9cd6fbb553',
      publicKeyYCoordinate:
        '05e28c1979ed37753e5b5f6dd3bb9babeabf561c7214fd01fcf4434745107b1f',
      privateKey:
        '0186532eaed1aa913e4bffc1b64e338cd7ce9c1afe35e395eee28777660dd959',
    })
  })

  it('correctly calculates the keys for apex', () => {
    const signature =
      '0xde864c207981b865c601a77cda6d669169a20a17980c38f151a4302432efb8013ec02c74c2bf4fb111dadcd9924ea023d6f690512cde22edbb5213487a43ae031c03'
    const pair = getGenericStarkExKeyPairFromData(signature)

    expect(pair).toEqual({
      publicKey:
        '07e6d96a3ed5152d2686edc1429b82404135698008d5722bd065df8d0020c447',
      publicKeyYCoordinate:
        '0356cfb50aa20e625c9b82e2fbadcf3c93dbd8ac8f5d738354f7dc53b522d105',
      privateKey:
        '0381ed01dd751a7a16f09802527fe85176aed3ab4ca22b1e19592bf64dfd05d6',
    })
  })
})

describe('getMyriaStarkExKeyPairFromData', () => {
  it('correctly calculates the keys', () => {
    const signature =
      '0xab5be8fe8719875ca90266e58e3bf4408014764db228494a69606d6ee03c36ea32e4bc7d076e972eb4ad859c8b813f8bd90c41f823ba0612efe321b7b684e59e1b'
    const pair = getMyriaStarkExKeyPairFromData(signature)

    expect(pair).toEqual({
      privateKey:
        '03c6bfb103d4282d984e20e75a00e92e6b8c29a9f358fcececc4a95530618087',
      publicKey:
        '033121552ab1991fa7a4585f9475e7e8b2c1dbc1ea72d4003de066dfa7ae933c',
      publicKeyYCoordinate:
        '05c3e97655db00eac0a4e4f6e4271deab609d6679c608486560eeef7f43a0fbb',
    })
  })
})
