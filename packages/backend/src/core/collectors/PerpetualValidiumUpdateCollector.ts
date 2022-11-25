import { decodeProgramOutput } from '@explorer/encoding'
import { EthereumAddress, Hash256 } from '@explorer/types'
import { BigNumber, utils } from 'ethers'

import { BlockRange } from '../../model'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { AvailabilityGatewayClient } from '../../peripherals/starkware/AvailabilityGatewayClient'
import { LogStateTransitionFact, LogUpdateState } from './events'

export class PerpetualValidiumUpdateCollector {
  constructor(
    private ethereumClient: EthereumClient,
    private availabilityGatewayClient: AvailabilityGatewayClient,
    private perpetual: EthereumAddress
  ) {}

  async collect(blockRange: BlockRange) {
    const logs = await this.ethereumClient.getLogsInRange(blockRange, {
      address: this.perpetual.toString(),
      topics: [[LogStateTransitionFact.topic, LogUpdateState.topic]],
    })

    const parsed = logs.map((log) => ({
      ...log,
      ...(LogStateTransitionFact.safeParseLog(log) ??
        LogUpdateState.parseLog(log)),
    }))

    if (parsed.length % 2 !== 0) {
      throw new Error('Some events have no pair')
    }

    const stateTransitions = []
    for (let i = 0; i < parsed.length / 2; i++) {
      const stateTransitionFact = parsed[i * 2]
      const updateState = parsed[i * 2 + 1]
      if (
        stateTransitionFact?.name !== 'LogStateTransitionFact' ||
        updateState?.name !== 'LogUpdateState' ||
        stateTransitionFact.transactionHash !== updateState.transactionHash
      ) {
        throw new Error('Invalid event order')
      }

      stateTransitions.push({
        transactionHash: Hash256(updateState.transactionHash),
        stateTransitionFact: Hash256(
          stateTransitionFact.args.stateTransitionFact
        ),
        sequenceNumber: updateState.args.sequenceNumber.toNumber(),
        batchId: updateState.args.batchId.toNumber(),
      })
    }

    const withData = await Promise.all(
      stateTransitions.map(async (x) => {
        const [batch, programOutput] = await Promise.all([
          this.availabilityGatewayClient.getPerpetualBatch(x.batchId),
          this.getProgramOutput(x.transactionHash),
        ])
        return {
          ...x,
          batch,
          programOutput,
        }
      })
    )

    console.log(withData)
  }

  private async getProgramOutput(transactionHash: Hash256) {
    const tx = await this.ethereumClient.getTransaction(transactionHash)
    if (!tx) {
      throw new Error('Invalid transaction')
    }
    const abi = new utils.Interface([
      'function updateState(uint256[] calldata programOutput, uint256[] calldata applicationData)',
    ])
    const decoded = abi.decodeFunctionData('updateState', tx.data)
    const programOutputValues = decoded.programOutput as BigNumber[]
    const hexData = programOutputValues
      .map((x) => x.toHexString().slice(2).padStart(64, '0'))
      .join('')
    return decodeProgramOutput(hexData)
  }
}
