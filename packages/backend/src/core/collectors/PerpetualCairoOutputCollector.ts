import {
  decodePerpetualCairoOutput,
  PerpetualCairoOutput,
} from '@explorer/encoding'
import { Hash256 } from '@explorer/types'
import { BigNumber, utils } from 'ethers'

import { StarkexConfig } from '../../config/starkex/StarkexConfig'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { toHexData } from '../../utils/toHexData'

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

    // This is a fix for Apex Goerli testnet, which switches
    // to a different program output (one more field) at block 8056029.
    // See: https://github.com/starkware-libs/stark-perpetual/blob/eaa284683deec190407fece98b96546d10f6ad67/src/services/perpetual/cairo/output/program_output.cairo#L36
    const skipDataAvailabilityModeField =
      this.starkexConfig.instanceName === 'ApeX' &&
      this.starkexConfig.blockchain.chainId === 5 && // it's goerli
      blockNumber >= 8056029

    return decodePerpetualCairoOutput(hexData, skipDataAvailabilityModeField)
  }
}
