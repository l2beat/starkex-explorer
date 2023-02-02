import { ethers } from 'ethers'

export async function contractMethodWrapper<T>(
  contract: ethers.Contract,
  method: string,
  arg?: bigint
) {
  let contractError: string | null = null
  let value: T | null = null

  //TODO: Do something about the unsafe calls and assignments

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
    value = await contract[method](arg)
  } catch {
    contractError = method
  }

  return {
    value,
    contractError,
  }
}
