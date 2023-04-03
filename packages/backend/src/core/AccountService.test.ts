import { EthereumAddress } from '@explorer/types'
import { expect, mockObject } from 'earl'

import { ForcedTradeOfferRepository } from '../peripherals/database/ForcedTradeOfferRepository'
import { PositionRepository } from '../peripherals/database/PositionRepository'
import { SentTransactionRepository } from '../peripherals/database/transactions/SentTransactionRepository'
import { AccountService } from './AccountService'

describe(AccountService.name, () => {
  it('returns undefined for undefined', async () => {
    const accountService = new AccountService(
      mockObject<PositionRepository>(),
      mockObject<ForcedTradeOfferRepository>(),
      mockObject<SentTransactionRepository>()
    )
    const result = await accountService.getAccount(undefined)
    expect(result).toEqual(undefined)
  })

  it('returns account without position id', async () => {
    const accountService = new AccountService(
      mockObject<PositionRepository>({
        findIdByEthereumAddress: async () => undefined,
      }),
      mockObject<ForcedTradeOfferRepository>(),
      mockObject<SentTransactionRepository>()
    )
    const address = EthereumAddress.fake()
    const result = await accountService.getAccount(address)
    expect(result).toEqual({
      address,
    })
  })

  it('returns account with position id', async () => {
    const accountService = new AccountService(
      mockObject<PositionRepository>({
        findIdByEthereumAddress: async () => 123n,
      }),
      mockObject<ForcedTradeOfferRepository>({
        countActiveByPositionId: async () => 0,
      }),
      mockObject<SentTransactionRepository>({
        countNotMinedByPositionId: async () => 0,
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

  it('returns has updates when active offers exist', async () => {
    const accountService = new AccountService(
      mockObject<PositionRepository>({
        findIdByEthereumAddress: async () => 123n,
      }),
      mockObject<ForcedTradeOfferRepository>({
        countActiveByPositionId: async () => 1,
      }),
      mockObject<SentTransactionRepository>({
        countNotMinedByPositionId: async () => 0,
      })
    )
    const address = EthereumAddress.fake()
    const result = await accountService.getAccount(address)
    expect(result).toEqual({
      address,
      hasUpdates: true,
      positionId: 123n,
    })
  })

  it('returns has updates when pending transactions exist', async () => {
    const accountService = new AccountService(
      mockObject<PositionRepository>({
        findIdByEthereumAddress: async () => 123n,
      }),
      mockObject<ForcedTradeOfferRepository>({
        countActiveByPositionId: async () => 0,
      }),
      mockObject<SentTransactionRepository>({
        countNotMinedByPositionId: async () => 1,
      })
    )
    const address = EthereumAddress.fake()
    const result = await accountService.getAccount(address)
    expect(result).toEqual({
      address,
      hasUpdates: true,
      positionId: 123n,
    })
  })
})
