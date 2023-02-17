import { EthereumAddress } from '@explorer/types'
import { expect } from 'earljs'

import { starkKeyPairFromData } from './keys'
import { getRegistrationData } from './registration'

describe(getRegistrationData.name, () => {
  it('returns correct data', () => {
    const pair = starkKeyPairFromData('0x1234')
    const ethKey = EthereumAddress('0xdeadbeef12345678deadbeef12345678deadbeef')

    const data = getRegistrationData(ethKey, pair)
    // Tested using tenderly simulation
    // The contract used: 0xF5C9F957705bea56a7e806943f98F7777B995826
    expect(data).toEqual(
      '0xbea84187000000000000000000000000deadbeef12345678deadbeef12345678deadbeef03f0bea10158aa087d8c80fe473539ba34dd90369b5b86314535631b43f1f57c0000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000006006d4864a858f37e99bff58cf2f10d77dc7b295d9fdf6694b83c7a013e6b99da205bb4e4d5084c0c152be5e30350f6558dc0a450bfcea7f570aeb739cac3534f30504030787dc3978dca14f23e757e34c00b1e1122055760b5c8a1e65d1f48c6c'
    )
  })
})
