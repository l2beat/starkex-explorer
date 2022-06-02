import { EthereumAddress, Hash256, StarkKey } from '@explorer/types'
import { expect } from 'earljs'
import { providers } from 'ethers'

import {
  coder,
  TransactionSubmitController,
} from '../../../src/api/controllers/TransactionSubmitController'
import { ForcedTradeOfferRepository } from '../../../src/peripherals/database/ForcedTradeOfferRepository'
import { ForcedTransactionsRepository } from '../../../src/peripherals/database/ForcedTransactionsRepository'
import { EthereumClient } from '../../../src/peripherals/ethereum/EthereumClient'
import { mock } from '../../mock'

describe(TransactionSubmitController.name, () => {
  describe(TransactionSubmitController.prototype.submitForcedExit.name, () => {
    it('handles nonexistent transaction', async () => {
      const controller = new TransactionSubmitController(
        mock<EthereumClient>(),
        mock<ForcedTransactionsRepository>(),
        mock<ForcedTradeOfferRepository>(),
        EthereumAddress.fake()
      )

      controller['getTransaction'] = async () => undefined

      const hash = Hash256.fake()
      const result = await controller.submitForcedExit(hash)

      expect(result).toEqual({
        type: 'bad request',
        content: `Transaction ${hash} not found`,
      })
    })

    it('handles transaction to a wrong address', async () => {
      const data = coder.encodeFunctionData('forcedWithdrawalRequest', [
        0,
        0,
        0,
        false,
      ])
      const controller = new TransactionSubmitController(
        mock<EthereumClient>({
          getTransaction: async () =>
            ({
              to: EthereumAddress.fake('b').toString(),
              data,
            } as providers.TransactionResponse),
        }),
        mock<ForcedTransactionsRepository>(),
        mock<ForcedTradeOfferRepository>(),
        EthereumAddress.fake('a')
      )

      const hash = Hash256.fake()
      const result = await controller.submitForcedExit(hash)

      expect(result).toEqual({
        type: 'bad request',
        content: `Invalid transaction`,
      })
    })

    it('handles transaction with unknown data', async () => {
      const controller = new TransactionSubmitController(
        mock<EthereumClient>({
          getTransaction: async () =>
            ({
              to: EthereumAddress.fake('a').toString(),
              data: '0x1234',
            } as providers.TransactionResponse),
        }),
        mock<ForcedTransactionsRepository>(),
        mock<ForcedTradeOfferRepository>(),
        EthereumAddress.fake('a')
      )

      const hash = Hash256.fake()
      const result = await controller.submitForcedExit(hash)

      expect(result).toEqual({
        type: 'bad request',
        content: `Invalid transaction`,
      })
    })

    it('handles transaction with correct data and address', async () => {
      const publicKey = StarkKey.fake()
      const positionId = 123n
      const amount = 456n
      const data = coder.encodeFunctionData('forcedWithdrawalRequest', [
        publicKey,
        positionId,
        amount,
        false,
      ])
      const perpetualAddress = EthereumAddress.fake()
      const hash = Hash256.fake()

      const repository = mock<ForcedTransactionsRepository>({
        add: async () => hash,
      })
      const controller = new TransactionSubmitController(
        mock<EthereumClient>({
          getTransaction: async () =>
            ({
              to: perpetualAddress.toString(),
              data,
            } as providers.TransactionResponse),
        }),
        repository,
        mock<ForcedTradeOfferRepository>(),
        perpetualAddress
      )

      const result = await controller.submitForcedExit(hash)

      expect(result).toEqual({
        type: 'created',
        content: { id: hash },
      })
    })
  })
})
