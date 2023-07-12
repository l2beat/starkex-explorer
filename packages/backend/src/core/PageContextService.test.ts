import { EthereumAddress, StarkKey } from '@explorer/types'
import { expect, mockFn, mockObject } from 'earl'

import { Config } from '../config'
import { fakeCollateralAsset } from '../test/fakes'
import { PageContextService } from './PageContextService'
import { UserService } from './UserService'

describe(PageContextService.name, () => {
  const perpetualConfig = {
    starkex: {
      tradingMode: 'perpetual',
      instanceName: 'dYdX',
      collateralAsset: fakeCollateralAsset,
      blockchain: {
        chainId: 1,
      },
    },
  } as Config
  const spotConfig = {
    starkex: {
      tradingMode: 'spot',
      instanceName: 'Myria',
      blockchain: {
        chainId: 5,
      },
    },
  } as const as Config

  describe(PageContextService.prototype.getPageContext.name, () => {
    it('should return the correct context for perpetuals', async () => {
      const givenUser = {
        address: EthereumAddress.fake(),
      }
      const mockedUserService = mockObject<UserService>({
        getUserDetails: mockFn(async () => undefined),
      })
      const pageContextService = new PageContextService(
        perpetualConfig,
        mockedUserService
      )

      const context = await pageContextService.getPageContext(givenUser)

      expect(context).toEqual({
        user: undefined,
        tradingMode: 'perpetual',
        showL2Transactions: true,
        chainId: 1,
        instanceName: perpetualConfig.starkex.instanceName,
        collateralAsset: fakeCollateralAsset,
      })
      expect(mockedUserService.getUserDetails).toHaveBeenCalledWith(givenUser)
    })

    it('should return the correct context for spot', async () => {
      const givenUser = {
        address: EthereumAddress.fake(),
      }
      const mockedUserService = mockObject<UserService>({
        getUserDetails: mockFn(async () => undefined),
      })
      const pageContextService = new PageContextService(
        spotConfig,
        mockedUserService
      )

      const context = await pageContextService.getPageContext(givenUser)

      expect(context).toEqual({
        user: undefined,
        tradingMode: 'spot',
        showL2Transactions: true,
        chainId: 5,
        instanceName: spotConfig.starkex.instanceName,
      })
      expect(mockedUserService.getUserDetails).toHaveBeenCalledWith(givenUser)
    })
  })
  describe(PageContextService.prototype.getPageContextWithUser.name, () => {
    it('should return correct context if user is connected', async () => {
      const givenUser = {
        address: EthereumAddress.fake(),
      }
      const pageContextService = new PageContextService(
        perpetualConfig,
        mockObject<UserService>({
          getUserDetails: mockFn(async () => givenUser),
        })
      )
      const pageContext = {
        user: givenUser,
        tradingMode: 'perpetual',
        chainId: 1,
        showL2Transactions: true,
        instanceName: spotConfig.starkex.instanceName,
        collateralAsset: fakeCollateralAsset,
      } as const
      pageContextService.getPageContext = mockFn(async () => pageContext)

      const context = await pageContextService.getPageContextWithUser(givenUser)

      expect(context).toEqual(pageContext)
    })

    it('should return undefined if user is not connected', async () => {
      const pageContextService = new PageContextService(
        perpetualConfig,
        mockObject<UserService>()
      )
      pageContextService.getPageContext = mockFn(
        async () =>
          ({
            user: undefined,
            tradingMode: 'perpetual',
            showL2Transactions: true,
            chainId: 1,
            instanceName: spotConfig.starkex.instanceName,
            collateralAsset: fakeCollateralAsset,
          } as const)
      )
      const context = await pageContextService.getPageContextWithUser({})

      expect(context).toEqual(undefined)
    })
  })
  describe(
    PageContextService.prototype.getPageContextWithUserAndStarkKey.name,
    () => {
      it('should return correct context if user is connected and has a stark key', async () => {
        const givenUser = {
          address: EthereumAddress.fake(),
          starkKey: StarkKey.fake(),
        }
        const pageContextService = new PageContextService(
          perpetualConfig,
          mockObject<UserService>({
            getUserDetails: mockFn(async () => givenUser),
          })
        )
        const pageContext = {
          user: givenUser,
          tradingMode: 'perpetual',
          chainId: 1,
          showL2Transactions: true,
          instanceName: spotConfig.starkex.instanceName,
          collateralAsset: fakeCollateralAsset,
        } as const
        pageContextService.getPageContextWithUser = mockFn(
          async () => pageContext
        )
        const context =
          await pageContextService.getPageContextWithUserAndStarkKey(givenUser)

        expect(context).toEqual(pageContext)
      })

      it('should return undefined if user is not connected', async () => {
        const pageContextService = new PageContextService(
          perpetualConfig,
          mockObject<UserService>()
        )
        pageContextService.getPageContextWithUser = mockFn(
          async () => undefined
        )
        const context =
          await pageContextService.getPageContextWithUserAndStarkKey({})

        expect(context).toEqual(undefined)
      })

      it('should return undefined if user is connected but does not have a stark key', async () => {
        const givenUser = {
          address: EthereumAddress.fake(),
        }
        const pageContextService = new PageContextService(
          perpetualConfig,
          mockObject<UserService>({
            getUserDetails: mockFn(async () => givenUser),
          })
        )
        const pageContext = {
          user: givenUser,
          tradingMode: 'perpetual',
          chainId: 1,
          showL2Transactions: true,
          instanceName: spotConfig.starkex.instanceName,
          collateralAsset: fakeCollateralAsset,
        } as const
        pageContextService.getPageContextWithUser = mockFn(
          async () => pageContext
        )
        const context =
          await pageContextService.getPageContextWithUserAndStarkKey(givenUser)

        expect(context).toEqual(undefined)
      })
    }
  )
  describe(PageContextService.prototype.getCollateralAsset.name, () => {
    it('should return the collateral asset for perpetuals', () => {
      const pageContextService = new PageContextService(
        perpetualConfig,
        mockObject<UserService>()
      )
      const pageContext = {
        user: undefined,
        tradingMode: 'perpetual',
        showL2Transactions: true,
        chainId: 5,
        instanceName: spotConfig.starkex.instanceName,
        collateralAsset: fakeCollateralAsset,
      } as const

      const collateralAsset = pageContextService.getCollateralAsset(pageContext)

      expect(collateralAsset).toEqual(fakeCollateralAsset)
    })

    it('should return undefined for spot', () => {
      const pageContextService = new PageContextService(
        spotConfig,
        mockObject<UserService>()
      )
      const pageContext = {
        user: undefined,
        tradingMode: 'spot',
        showL2Transactions: true,
        chainId: 5,
        instanceName: spotConfig.starkex.instanceName,
      } as const

      const collateralAsset = pageContextService.getCollateralAsset(pageContext)

      expect(collateralAsset).toEqual(undefined)
    })
  })
})
