import { decodeFirstPage, StarkExProgramOutput } from '@explorer/encoding'
import { Hash256 } from '@explorer/types'
import { BigNumber, utils } from 'ethers'

import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'

const ABI = new utils.Interface([
  'function updateState(uint256[] calldata programOutput, uint256[] calldata applicationData)',
])

export class ProgramOutputCollector {
  constructor(private readonly ethereumClient: EthereumClient) {}

  async collect(transactionHash: Hash256): Promise<StarkExProgramOutput> {
    const tx = await this.ethereumClient.getTransaction(transactionHash)
    if (!tx) {
      throw new Error('Invalid transaction')
    }
    const decoded = ABI.decodeFunctionData('updateState', tx.data)
    const programOutputValues = decoded.programOutput as BigNumber[]
    const hexData = programOutputValues
      .map((x) => x.toHexString().slice(2).padStart(64, '0'))
      .join('')
    return decodeFirstPage(hexData)
  }
}
