import { EthereumAddress, Hash256, StarkKey, Timestamp } from '@explorer/types'
import { utils } from 'ethers'

import { ForcedTransactionsRepository } from '../../peripherals/database/ForcedTransactionsRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { sleep } from '../../tools/sleep'
import { ControllerResult } from './ControllerResult'

export const coder = new utils.Interface([
  'function forcedWithdrawalRequest(uint256 starkKey, uint256 vaultId, uint256 quantizedAmount, bool premiumCost)',
])

export class TransactionSubmitController {
  constructor(
    private ethereumClient: EthereumClient,
    private forcedTransactionsRepository: ForcedTransactionsRepository,
    private perpetualAddress: EthereumAddress
  ) {}

  async submitForcedExit(hash: Hash256): Promise<ControllerResult> {
    const sentAt = Timestamp(Date.now())
    const tx = await this.getTransaction(hash)
    if (!tx) {
      return { type: 'bad request', content: `Transaction ${hash} not found` }
    }
    const data = decodeWithdrawalData(tx.data)
    if (!tx.to || EthereumAddress(tx.to) !== this.perpetualAddress || !data) {
      return { type: 'bad request', content: `Invalid transaction` }
    }
    await this.forcedTransactionsRepository.add(
      {
        data: {
          type: 'withdrawal',
          amount: data.quantizedAmount,
          positionId: data.vaultId,
          publicKey: data.starkKey,
        },
        hash,
      },
      sentAt
    )
    return { type: 'created', content: { id: hash } }
  }

  private async getTransaction(hash: Hash256) {
    for (const ms of [0, 1000, 4000]) {
      if (ms) {
        await sleep(ms)
      }
      const tx = await this.ethereumClient.getTransaction(hash)
      if (tx) {
        return tx
      }
    }
  }
}

function decodeWithdrawalData(data: string) {
  try {
    const decoded = coder.decodeFunctionData('forcedWithdrawalRequest', data)
    return {
      starkKey: StarkKey.from(decoded.starkKey),
      vaultId: BigInt(decoded.vaultId),
      quantizedAmount: BigInt(decoded.quantizedAmount),
      premiumCost: Boolean(decoded.premiumCost),
    }
  } catch {
    return
  }
}
