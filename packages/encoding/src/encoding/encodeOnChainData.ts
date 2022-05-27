import { OnChainData } from '../OnChainData'
import { ByteWriter } from './ByteWriter'
import { encodeFirstPage } from './encodeFirstPage'
import { writeFundingEntries } from './writeFundingEntries'
import { writePositionUpdate } from './writePositionUpdate'

export function encodeOnChainData(data: OnChainData): string[] {
  const first = encodeFirstPage(data)
  const second = encodeUpdates(data)
  return [first, second]
}

export function encodeUpdates(data: OnChainData) {
  const writer = new ByteWriter()

  writeFundingEntries(writer, data)

  for (const position of data.positions) {
    writePositionUpdate(writer, position)
  }

  return writer.getBytes()
}
