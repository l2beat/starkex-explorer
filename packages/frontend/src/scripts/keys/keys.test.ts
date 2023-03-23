import { expect } from 'earljs'

import {
  getDydxStarkExKeyPairFromData,
  getMyriaStarkExKeyPairFromData,
} from './keys'

describe(getDydxStarkExKeyPairFromData.name, () => {
  it('correctly calculates the keys', () => {
    const data = '0x12345678'
    const pair = getDydxStarkExKeyPairFromData(data)

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
