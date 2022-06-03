import { Modification } from '../OnChainData'
import { ByteWriter } from './ByteWriter'

export function writeModifications(
  writer: ByteWriter,
  modifications: Modification[]
) {
  writer.writeNumber(modifications.length, 32)
  for (const { starkKey, positionId, difference } of modifications) {
    writer.write(starkKey.toString(), 32)
    writer.writeNumber(positionId, 32)
    writer.writeNumber(difference + 2n ** 64n, 32)
  }
}
