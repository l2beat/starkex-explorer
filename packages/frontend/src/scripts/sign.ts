import { utils } from 'ethers'
import { keccak256, pack } from '@ethersproject/solidity'
import { encodeAssetId } from '@explorer/encoding'
import { AssetId } from '@explorer/types'

export function initSign() {
  const ethSignButton = document.querySelector<HTMLButtonElement>('#eth_sign')
  const personalSignButton =
    document.querySelector<HTMLButtonElement>('#personal_sign')
  const provider = window.ethereum
  const address = ethSignButton?.dataset.account
  if (!ethSignButton || !personalSignButton || !provider || !address) {
    return
  }

  const starkKeyA = 123
  const starkKeyB = 456
  const positionIdA = 1
  const positionIdB = 2

  const syntheticAssetId = AssetId('ETH-9')
  const amountCollateral = 1n
  const amountSynthetic = 1n
  const aIsBuyingSynthetic = 1n
  const nonce = 1n
  const submissionExpirationTime = 12345678

  const packedParameters = pack(
    [
      'uint256',
      'uint256',
      'uint256',
      'uint256',
      'uint256',
      'uint256',
      'uint256',
      'uint256',
      'bool',
      'uint256',
    ],
    [
      starkKeyA,
      starkKeyB,
      positionIdA,
      positionIdB,
      `0x${encodeAssetId(AssetId.USDC)}`,
      `0x${encodeAssetId(syntheticAssetId)}`,
      amountCollateral,
      amountSynthetic,
      aIsBuyingSynthetic,
      nonce,
    ]
  )

  const actionHash = keccak256(
    ['string', 'bytes'],
    ['FORCED_TRADE', packedParameters]
  )

  const dataHashToSign = keccak256(
    ['bytes32', 'uint256'],
    [actionHash, submissionExpirationTime]
  )

  console.log(dataHashToSign)

  ethSignButton.addEventListener('click', async () => {
    const signature = (await provider.request({
      method: 'eth_sign',
      params: [address, dataHashToSign],
    })) as string

    const signer = utils.recoverAddress(dataHashToSign, signature)

    console.log(signer)
    console.log(address)
  })

  personalSignButton.addEventListener('click', async () => {
    const signature = (await provider.request({
      method: 'personal_sign',
      params: [address, dataHashToSign],
    })) as string

    const signer = utils.recoverAddress(
      utils.hashMessage(utils.arrayify(dataHashToSign)),
      signature
    )

    console.log(signer, 'signer')
    console.log(address, 'address')
    console.log(address === signer ? 'SUCCESS' : 'FAILURE')
  })
}
