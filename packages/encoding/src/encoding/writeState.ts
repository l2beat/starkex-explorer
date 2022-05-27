import { State } from '../OnChainData'
import { ByteWriter } from './ByteWriter'
import { encodeState } from './encodeState'

export function writeState(writer: ByteWriter, state: State) {
  const stateBytes = encodeState(state)
  writer.writeNumber(stateBytes.length / 2 / 32, 32)
  writer.write(stateBytes)
}
