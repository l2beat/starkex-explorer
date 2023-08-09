import { EthereumAddress, Timestamp } from '@explorer/types'
import { Logger } from '@l2beat/backend-tools'
import { expect, mockFn, mockObject } from 'earl'
import { ethers } from 'ethers'

import { KeyValueStore } from '../peripherals/database/KeyValueStore'
import { UserTransactionRepository } from '../peripherals/database/transactions/UserTransactionRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { FreezeCheckService } from './FreezeCheckService'

describe(FreezeCheckService.name, () => {
  describe(FreezeCheckService.prototype.updateFreezeStatus.name, () => {
    it('sets to not-frozen when no blocks synced', async () => {
      const kvStoreMock = mockObject<KeyValueStore>({
        findByKey: mockFn().resolvesTo(undefined),
        addOrUpdate: mockFn().resolvesTo(undefined),
      })

      const service = new FreezeCheckService(
        EthereumAddress.ZERO,
        mockObject<EthereumClient>(),
        kvStoreMock,
        mockObject<UserTransactionRepository>(),
        Logger.SILENT
      )

      await service.updateFreezeStatus()

      expect(kvStoreMock.addOrUpdate).toHaveBeenOnlyCalledWith({
        key: 'freezeStatus',
        value: 'not-frozen',
      })
    })

    it('sets to frozen when freezeRequestExists returns true', async () => {
      const kvStoreMock = mockObject<KeyValueStore>({
        findByKey: mockFn().resolvesTo(1),
        addOrUpdate: mockFn().resolvesTo(undefined),
      })
      const ethereumClientMock = mockObject<EthereumClient>({
        getBlockTimestamp: mockFn().resolvesTo(123000000),
        call: mockFn()
          .given(
            EthereumAddress.fake('fade'),
            'FREEZE_GRACE_PERIOD',
            'function FREEZE_GRACE_PERIOD() view returns (uint256)'
          )
          .resolvesToOnce([ethers.BigNumber.from(360000), undefined]),
      })
      const userTransactionRepositoryMock =
        mockObject<UserTransactionRepository>({
          findOldestNotIncluded: mockFn().resolvesTo({
            timestamp: Timestamp.fromSeconds(123000000),
          }),
          freezeRequestExists: mockFn().resolvesTo(true),
        })

      const service = new FreezeCheckService(
        EthereumAddress.fake('fade'),
        ethereumClientMock,
        kvStoreMock,
        userTransactionRepositoryMock,
        Logger.SILENT
      )

      await service.updateFreezeStatus()

      expect(kvStoreMock.addOrUpdate).toHaveBeenOnlyCalledWith({
        key: 'freezeStatus',
        value: 'frozen',
      })
      expect(ethereumClientMock.call).toHaveBeenExhausted()
    })

    it('sets to not-frozen when no not-included transactions', async () => {
      const kvStoreMock = mockObject<KeyValueStore>({
        findByKey: mockFn().resolvesTo(1),
        addOrUpdate: mockFn().resolvesTo(undefined),
      })
      const ethereumClientMock = mockObject<EthereumClient>({
        getBlockTimestamp: mockFn().resolvesTo(123000000),
        call: mockFn()
          .given(
            EthereumAddress.fake('fade'),
            'FREEZE_GRACE_PERIOD',
            'function FREEZE_GRACE_PERIOD() view returns (uint256)'
          )
          .resolvesToOnce([ethers.BigNumber.from(360000), undefined]),
      })
      const userTransactionRepositoryMock =
        mockObject<UserTransactionRepository>({
          findOldestNotIncluded: mockFn().resolvesTo(undefined),
          freezeRequestExists: mockFn().resolvesTo(false),
        })

      const service = new FreezeCheckService(
        EthereumAddress.fake('fade'),
        ethereumClientMock,
        kvStoreMock,
        userTransactionRepositoryMock,
        Logger.SILENT
      )

      await service.updateFreezeStatus()

      expect(kvStoreMock.addOrUpdate).toHaveBeenOnlyCalledWith({
        key: 'freezeStatus',
        value: 'not-frozen',
      })
      expect(ethereumClientMock.call).toHaveBeenExhausted()
    })

    it("sets not-frozen when grace period hasn't passed", async () => {
      const kvStoreMock = mockObject<KeyValueStore>({
        findByKey: mockFn().resolvesTo(1),
        addOrUpdate: mockFn().resolvesTo(undefined),
      })
      const ethereumClientMock = mockObject<EthereumClient>({
        getBlockTimestamp: mockFn().resolvesTo(1200),
        call: mockFn()
          .given(
            EthereumAddress.fake('fade'),
            'FREEZE_GRACE_PERIOD',
            'function FREEZE_GRACE_PERIOD() view returns (uint256)'
          )
          .resolvesToOnce([ethers.BigNumber.from(300), undefined]),
      })
      const userTransactionRepositoryMock =
        mockObject<UserTransactionRepository>({
          findOldestNotIncluded: mockFn().resolvesTo({
            timestamp: Timestamp.fromSeconds(1000),
          }),
          freezeRequestExists: mockFn().resolvesTo(false),
        })

      const service = new FreezeCheckService(
        EthereumAddress.fake('fade'),
        ethereumClientMock,
        kvStoreMock,
        userTransactionRepositoryMock,
        Logger.SILENT
      )

      await service.updateFreezeStatus()

      expect(kvStoreMock.addOrUpdate).toHaveBeenOnlyCalledWith({
        key: 'freezeStatus',
        value: 'not-frozen',
      })
      expect(ethereumClientMock.call).toHaveBeenExhausted()
    })

    it('sets freezable when grace period has passed', async () => {
      const kvStoreMock = mockObject<KeyValueStore>({
        findByKey: mockFn().resolvesTo(1),
        addOrUpdate: mockFn().resolvesTo(undefined),
      })
      const ethereumClientMock = mockObject<EthereumClient>({
        getBlockTimestamp: mockFn().resolvesTo(1301),
        call: mockFn()
          .given(
            EthereumAddress.fake('fade'),
            'FREEZE_GRACE_PERIOD',
            'function FREEZE_GRACE_PERIOD() view returns (uint256)'
          )
          .resolvesToOnce([ethers.BigNumber.from(300), undefined]),
      })
      const userTransactionRepositoryMock =
        mockObject<UserTransactionRepository>({
          findOldestNotIncluded: mockFn().resolvesTo({
            timestamp: Timestamp.fromSeconds(1000),
          }),
          freezeRequestExists: mockFn().resolvesTo(false),
        })

      const service = new FreezeCheckService(
        EthereumAddress.fake('fade'),
        ethereumClientMock,
        kvStoreMock,
        userTransactionRepositoryMock,
        Logger.SILENT
      )

      await service.updateFreezeStatus()

      expect(kvStoreMock.addOrUpdate).toHaveBeenOnlyCalledWith({
        key: 'freezeStatus',
        value: 'freezable',
      })
      expect(ethereumClientMock.call).toHaveBeenExhausted()
    })
  })
})
