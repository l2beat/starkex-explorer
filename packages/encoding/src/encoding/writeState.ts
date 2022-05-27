import { State } from '../OnChainData'
import { ByteWriter } from './ByteWriter'
import { encodeState } from './encodeState'

export function writeState(writer: ByteWriter, data: State) {
  const stateBytes = encodeState(data)
  writer.writeNumber(stateBytes.length / 2 / 32, 32)
  writer.write(stateBytes)
}
