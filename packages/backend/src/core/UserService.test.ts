import { EthereumAddress, StarkKey } from '@explorer/types'
import { expect, mockObject } from 'earljs'

import { UserRegistrationEventRepository } from '../peripherals/database/UserRegistrationEventRepository'
import { UserService } from './UserService'

describe(UserService.name, () => {
  it('no address', async () => {
    const repository = mockObject<UserRegistrationEventRepository>()
    const userService = new UserService(repository)
    const result = await userService.getUserDetails({})
    expect(result).toEqual(undefined)
  })

  it('address is not registered', async () => {
    const address = EthereumAddress.fake()

    const repository = mockObject<UserRegistrationEventRepository>({
      findByEthereumAddress: async () => undefined,
    })
    const userService = new UserService(repository)

    const result = await userService.getUserDetails({ address })
    expect(result).toEqual({ address, starkKey: undefined })
  })

  it('address is registered', async () => {
    const address = EthereumAddress.fake()
    const starkKey = StarkKey.fake()

    const repository = mockObject<UserRegistrationEventRepository>({
      findByEthereumAddress: async () => ({
        id: 1,
        blockNumber: 1,
        ethAddress: address,
        starkKey,
      }),
    })
    const userService = new UserService(repository)

    const result = await userService.getUserDetails({ address })
    expect(result).toEqual({ address, starkKey })
  })

  it('stark key is known', async () => {
    const address = EthereumAddress.fake()
    const starkKey = StarkKey.fake()

    const repository = mockObject<UserRegistrationEventRepository>()
    const userService = new UserService(repository)

    const result = await userService.getUserDetails({ address, starkKey })
    expect(result).toEqual({ address, starkKey })
  })
})
