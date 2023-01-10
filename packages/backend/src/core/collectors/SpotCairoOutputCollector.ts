import { decodeSpotCairoOutput, SpotCairoOutput } from '@explorer/encoding'
import { Hash256 } from '@explorer/types'
import { BigNumber, utils } from 'ethers'

import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { toHexData } from '../../utils/toHexData'

const ABI = new utils.Interface([
  'function updateState(uint256[] calldata publicInput, uint256[] calldata applicationData)',
])

export class SpotCairoOutputCollector {
  constructor(private readonly ethereumClient: EthereumClient) {}

  async collect(transactionHash: Hash256): Promise<SpotCairoOutput> {
    const tx = await this.ethereumClient.getTransaction(transactionHash)
    if (!tx) {
      throw new Error('Invalid transaction')
    }
    const decoded = ABI.decodeFunctionData('updateState', tx.data)
    const dexOutputValues = decoded.publicInput as BigNumber[]
    const hexData = toHexData(dexOutputValues)
    return decodeSpotCairoOutput(hexData)
  }
}
