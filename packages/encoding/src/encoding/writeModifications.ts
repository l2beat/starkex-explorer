import { OnChainData } from '../OnChainData'
import { ByteWriter } from './ByteWriter'

export function writeModifications(writer: ByteWriter, data: OnChainData) {
  writer.writeNumber(data.modifications.length, 32)
  for (const { publicKey, positionId, difference } of data.modifications) {
    writer.write(publicKey.toString(), 32)
    writer.writeNumber(positionId, 32)
    writer.writeNumber(difference + 2n ** 64n, 32)
  }
}
