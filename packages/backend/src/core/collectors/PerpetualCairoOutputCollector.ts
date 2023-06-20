import {
  decodePerpetualCairoOutput,
  PerpetualCairoOutput,
} from '@explorer/encoding'
import { Hash256 } from '@explorer/types'
import { BigNumber, utils } from 'ethers'

import { StarkexConfig } from '../../config/starkex/StarkexConfig'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { toHexData } from '../../utils/toHexData'
import { shouldSkipDataAvailabilityModeField } from './shouldSkipDataAvailabilityModeField'

const ABI = new utils.Interface([
  'function updateState(uint256[] calldata programOutput, uint256[] calldata applicationData)',
])

export class PerpetualCairoOutputCollector {
  constructor(
    private readonly ethereumClient: EthereumClient,
    private readonly starkexConfig: StarkexConfig
  ) {}

  async collect(
    transactionHash: Hash256,
    blockNumber: number
  ): Promise<PerpetualCairoOutput> {
    const tx = await this.ethereumClient.getTransaction(transactionHash)
    if (!tx) {
      throw new Error('Invalid transaction')
    }
    const decoded = ABI.decodeFunctionData('updateState', tx.data)
    const programOutputValues = decoded.programOutput as BigNumber[]
    const hexData = toHexData(programOutputValues)

    const skipDataAvailabilityModeField = shouldSkipDataAvailabilityModeField(
      blockNumber,
      this.starkexConfig.instanceName,
      this.starkexConfig.blockchain.chainId
    )

    return decodePerpetualCairoOutput(hexData, skipDataAvailabilityModeField)
  }
}
