import { utils } from 'ethers'

export function EthereumEvent<N extends string, A extends object>(
  abi: `event ${N}(${string}`
) {
  const name = abi.match(/event\s+(\w+)\s*\(/)?.[1]
  if (!name) {
    throw new Error('Programmer error: invalid event abi')
  }
  const parser = new utils.Interface([abi])
  const topic = parser.getEventTopic(name)
  return {
    topic,
    abi: parser,
    parseLog(log: { topics: string[]; data: string }) {
      const parsed = parser.parseLog(log)
      return {
        name: parsed.name as N,
        args: parsed.args as A,
      }
    },
    safeParseLog(log: { topics: string[]; data: string }) {
      try {
        return this.parseLog(log)
      } catch {
        return undefined
      }
    },
  }
}
