import { EthereumAddress } from '@explorer/types'
import { expect } from 'earl'

import { starkKeyPairFromData } from './keys'
import { signRegistration } from './recovery'

describe(signRegistration.name, () => {
  it('returns correct data', () => {
    const pair = starkKeyPairFromData('0x1234')
    const ethKey = EthereumAddress('0xdeadbeef12345678deadbeef12345678deadbeef')

    const data = signRegistration(ethKey, pair)
    // Tested against tenderly simulation
    // The contract used: 0xF5C9F957705bea56a7e806943f98F7777B995826
    expect(data.rsy).toEqual(
      '0x06d4864a858f37e99bff58cf2f10d77dc7b295d9fdf6694b83c7a013e6b99da205bb4e4d5084c0c152be5e30350f6558dc0a450bfcea7f570aeb739cac3534f30504030787dc3978dca14f23e757e34c00b1e1122055760b5c8a1e65d1f48c6c'
    )
  })
})
