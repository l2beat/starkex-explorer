// https://eips.ethereum.org/EIPS/eip-1193

interface ProviderMessage {
  readonly type: string
  readonly data: unknown
}

interface EthSubscription extends ProviderMessage {
  readonly type: 'eth_subscription'
  readonly data: {
    readonly subscription: string
    readonly result: unknown
  }
}

interface ProviderConnectInfo {
  /** hexadecimal string */
  readonly chainId: string
}

interface RequestArguments {
  readonly method: string
  readonly params?: readonly unknown[] | object
}

interface ProviderRpcError extends Error {
  code: number
  data?: unknown
}

interface Provider {
  request(args: RequestArguments): Promise<unknown>

  on(eventName: 'message', listener: (message: ProviderMessage) => void): void
  on(eventName: 'connect', listener: (info: ProviderConnectInfo) => void): void
  on(eventName: 'disconnect', listener: (error: ProviderRpcError) => void): void
  on(eventName: 'chainChanged', listener: (chainId: string) => void): void
  on(eventName: 'accountsChanged', listener: (accounts: string[]) => void): void
  on(eventName: string, listener: (value: unknown) => void): void

  removeListener(
    eventName: 'message',
    listener: (message: ProviderMessage) => void
  ): void
  removeListener(
    eventName: 'connect',
    listener: (info: ProviderConnectInfo) => void
  ): void
  removeListener(
    eventName: 'disconnect',
    listener: (error: ProviderRpcError) => void
  ): void
  removeListener(
    eventName: 'chainChanged',
    listener: (chainId: string) => void
  ): void
  removeListener(
    eventName: 'accountsChanged',
    listener: (accounts: string[]) => void
  ): void
  removeListener(eventName: string, listener: (value: unknown) => void): void
}

interface Window {
  ethereum: Provider | undefined
}
