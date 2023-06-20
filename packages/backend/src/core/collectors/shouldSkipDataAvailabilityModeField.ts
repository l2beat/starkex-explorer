import { InstanceName } from '@explorer/shared'

export function shouldSkipDataAvailabilityModeField(
  blockNumber: number,
  instanceName: InstanceName,
  chainId: number
) {
  // This is a fix for Apex Goerli testnet, which switches
  // to a different program output (one more field) at block 8056029.
  // See: https://github.com/starkware-libs/stark-perpetual/blob/eaa284683deec190407fece98b96546d10f6ad67/src/services/perpetual/cairo/output/program_output.cairo#L36
  return (
    instanceName === 'ApeX' &&
    chainId === 5 && // it's goerli
    blockNumber >= 8056029
  )
}
