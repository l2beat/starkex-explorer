import { decodeDexOutput, StarkExDexOutput } from '@explorer/encoding'
import { Hash256 } from '@explorer/types'
import { BigNumber, utils } from 'ethers'

import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'

const ABI = new utils.Interface([
  'function updateState(uint256[] calldata publicInput, uint256[] calldata applicationData)',
])

export class DexOutputCollector {
  constructor(private readonly ethereumClient: EthereumClient) {}

  async collect(transactionHash: Hash256): Promise<StarkExDexOutput> {
    const tx = await this.ethereumClient.getTransaction(transactionHash)
    if (!tx) {
      throw new Error('Invalid transaction')
    }
    const decoded = ABI.decodeFunctionData('updateState', tx.data)
    const dexOutputValues = decoded.publicInput as BigNumber[]
    const hexData = dexOutputValues
      .map((x) => x.toHexString().slice(2).padStart(64, '0'))
      .join('')
    return decodeDexOutput(hexData)
  }
}
