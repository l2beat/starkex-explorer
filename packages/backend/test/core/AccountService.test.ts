import { EthereumAddress } from '@explorer/types'
import { expect } from 'earljs'

import { AccountService } from '../../src/core/AccountService'
import { PositionRepository } from '../../src/peripherals/database/PositionRepository'
import { mock } from '../mock'

describe(AccountService.name, () => {
  it('returns undefined for undefined', async () => {
    const accountService = new AccountService(mock<PositionRepository>())
    const result = await accountService.getAccount(undefined)
    expect(result).toEqual(undefined)
  })

  it('returns account without position id', async () => {
    const accountService = new AccountService(
      mock<PositionRepository>({
        findIdByEthereumAddress: async () => undefined,
      })
    )
    const address = EthereumAddress.fake()
    const result = await accountService.getAccount(address)
    expect(result).toEqual({
      address,
      hasUpdates: false,
      positionId: undefined,
    })
  })

  it('returns account with position id', async () => {
    const accountService = new AccountService(
      mock<PositionRepository>({
        findIdByEthereumAddress: async () => 123n,
      })
    )
    const address = EthereumAddress.fake()
    const result = await accountService.getAccount(address)
    expect(result).toEqual({
      address,
      hasUpdates: false,
      positionId: 123n,
    })
  })
})
