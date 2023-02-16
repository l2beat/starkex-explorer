import { expect } from 'earljs'

import { keyPairFromData } from './keys'

describe(keyPairFromData.name, () => {
  it('correctly calculates the keys', () => {
    const data = '0x12345678'
    const pair = keyPairFromData(data)

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
