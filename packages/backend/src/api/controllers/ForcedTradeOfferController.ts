import { encodeAssetId } from '@explorer/encoding'
import { AssetId, EthereumAddress, Timestamp } from '@explorer/types'
import {
  hashMessage,
  recoverAddress,
  solidityKeccak256,
  solidityPack,
} from 'ethers/lib/utils'

import {
  AcceptedData,
  ForcedTradeOfferRecord,
  ForcedTradeOfferRepository,
} from '../../peripherals/database/ForcedTradeOfferRepository'
import {
  PositionRecord,
  PositionRepository,
} from '../../peripherals/database/PositionRepository'
import { UserRegistrationEventRepository } from '../../peripherals/database/UserRegistrationEventRepository'
import { ControllerResult } from './ControllerResult'

export class ForcedTradeOfferController {
  constructor(
    private offerRepository: ForcedTradeOfferRepository,
    private positionRepository: PositionRepository,
    private userRegistrationEventRepository: UserRegistrationEventRepository
  ) {}

  async postOffer(
    offer: Omit<ForcedTradeOfferRecord, 'createdAt' | 'id'>,
    signature: string
  ): Promise<ControllerResult> {
    const positionA = await this.positionRepository.findById(offer.positionIdA)
    const userRegistrationEventA =
      await this.userRegistrationEventRepository.findByStarkKey(offer.starkKeyA)

    if (!positionA || !userRegistrationEventA) {
      return { type: 'not found', content: 'Position does not exist.' }
    }

    const offerValid = validateInitialOffer(
      offer,
      positionA,
      signature,
      userRegistrationEventA.ethAddress
    )

    if (!offerValid) {
      return { type: 'bad request', content: 'Your offer is invalid.' }
    }

    const id = await this.offerRepository.add({
      createdAt: Timestamp(Date.now()),
      ...offer,
    })
    return { type: 'created', content: { id } }
  }

  async acceptOffer(
    offerId: number,
    acceptedData: Omit<AcceptedData, 'at'>
  ): Promise<ControllerResult> {
    const positionB = await this.positionRepository.findById(
      acceptedData.positionIdB
    )
    const userRegistrationEventB =
      await this.userRegistrationEventRepository.findByStarkKey(
        acceptedData.starkKeyB
      )

    if (!positionB || !userRegistrationEventB) {
      return { type: 'not found', content: 'Position does not exist.' }
    }
    const offer = await this.offerRepository.findById(offerId)

    if (!offer) {
      return { type: 'not found', content: 'Offer does not exist.' }
    }

    if (offer.accepted) {
      return {
        type: 'bad request',
        content: 'Offer already accepted by a user.',
      }
    }

    const offerValid = validateAcceptedOffer(
      offer,
      acceptedData,
      positionB,
      userRegistrationEventB.ethAddress
    )

    if (!offerValid) {
      return { type: 'bad request', content: 'Your offer is invalid.' }
    }

    await this.offerRepository.save({
      ...offer,
      accepted: {
        ...acceptedData,
        at: Timestamp(Date.now()),
      },
    })

    return { type: 'success', content: 'Accept offer was submitted.' }
  }
}

function validateInitialOffer(
  offer: Omit<ForcedTradeOfferRecord, 'createdAt' | 'id'>,
  position: PositionRecord,
  signature: string,
  ethAddressA: EthereumAddress
) {
  const userIsBuyingSynthetic = offer.aIsBuyingSynthetic

  if (!validateBalance(offer, position, userIsBuyingSynthetic)) {
    return false
  }

  return validateInitialSignature(offer, signature, ethAddressA)
}

function validateAcceptedOffer(
  initialOffer: ForcedTradeOfferRecord,
  acceptedData: Omit<AcceptedData, 'at'>,
  position: PositionRecord,
  ethAddressB: EthereumAddress
) {
  const userIsBuyingSynthetic = !initialOffer.aIsBuyingSynthetic

  if (!validateBalance(initialOffer, position, userIsBuyingSynthetic)) {
    return false
  }

  return validateAcceptedSignature(initialOffer, acceptedData, ethAddressB)
}

function validateBalance(
  offer: Omit<ForcedTradeOfferRecord, 'createdAt' | 'id'>,
  position: PositionRecord,
  userIsBuyingSynthetic: boolean
) {
  const { amountCollateral, amountSynthetic, syntheticAssetId } = offer

  const { collateralBalance } = position

  if (userIsBuyingSynthetic && amountCollateral <= collateralBalance) {
    return true
  }

  if (!userIsBuyingSynthetic) {
    const balanceSynthetic = position.balances.find(
      (balance) => balance.assetId === syntheticAssetId
    )?.balance
    if (balanceSynthetic && balanceSynthetic >= amountSynthetic) {
      return true
    }
  }

  return false
}

export function validateInitialSignature(
  offer: Omit<ForcedTradeOfferRecord, 'createdAt' | 'id'>,
  signature: string,
  ethAddressA: EthereumAddress
) {
  const stringOffer = JSON.stringify(
    {
      starkKeyA: offer.starkKeyA,
      positionIdA: offer.positionIdA.toString(),
      syntheticAssetId: offer.syntheticAssetId,
      amountCollateral: offer.amountCollateral.toString(),
      amountSynthetic: offer.amountSynthetic.toString(),
      aIsBuyingSynthetic: offer.aIsBuyingSynthetic,
    },
    null,
    2
  )

  const signer = recoverAddress(hashMessage(stringOffer), signature)

  console.log(signer)
  return signer === ethAddressA.toString()
}

export function validateAcceptedSignature(
  initialOffer: Omit<ForcedTradeOfferRecord, 'createdAt' | 'id'>,
  acceptedOffer: Omit<AcceptedData, 'at'>,
  ethAddressB: EthereumAddress
): boolean {
  const {
    starkKeyA,
    positionIdA,
    syntheticAssetId,
    amountCollateral,
    amountSynthetic,
    aIsBuyingSynthetic,
  } = initialOffer
  const { starkKeyB, positionIdB, nonce, submissionExpirationTime, signature } =
    acceptedOffer

  try {
    const packedParameters = solidityPack(
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

    const actionHash = solidityKeccak256(
      ['string', 'bytes'],
      ['FORCED_TRADE', packedParameters]
    )

    const signedData = solidityKeccak256(
      ['bytes32', 'uint256'],
      [actionHash, submissionExpirationTime]
    )

    const signer = recoverAddress(signedData, signature)

    return signer === ethAddressB.toString()
  } catch (e) {
    return false
  }
}
