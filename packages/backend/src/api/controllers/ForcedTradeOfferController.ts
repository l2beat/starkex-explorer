import { encodeAssetId } from '@explorer/encoding'
import { AssetId, EthereumAddress, Timestamp } from '@explorer/types'
import {
  recoverAddress,
  solidityKeccak256,
  solidityPack,
} from 'ethers/lib/utils'

import {
  ForcedTradeAcceptRecord,
  ForcedTradeInitialOfferRecord,
  ForcedTradeOfferRepository,
} from '../../peripherals/database/ForcedTradeOfferRepository'
import {
  PositionRecord,
  StateUpdateRepository,
} from '../../peripherals/database/StateUpdateRepository'
import { UserRegistrationEventRepository } from '../../peripherals/database/UserRegistrationEventRepository'
import { ControllerResult } from './ControllerResult'

export class ForcedTradeOfferController {
  constructor(
    private offerRepository: ForcedTradeOfferRepository,
    private stateUpdateRepository: StateUpdateRepository,
    private userRegistrationEventRepository: UserRegistrationEventRepository
  ) {}

  async postOffer(
    offer: Omit<ForcedTradeInitialOfferRecord, 'createdAt' | 'id'>
  ): Promise<ControllerResult> {
    const positionA = await this.stateUpdateRepository.getPositionById(
      offer.positionIdA
    )

    if (!positionA) {
      return { type: 'not found', content: 'Position does not exist.' }
    }

    const offerValidated = validateInitialOffer(offer, positionA)

    if (!offerValidated) {
      return { type: 'bad request', content: 'Your offer is invalid.' }
    }

    const createdAt = Timestamp(Date.now())

    const id = await this.offerRepository.addInitialOffer({
      createdAt,
      ...offer,
    })
    return { type: 'created', content: { id } }
  }

  async acceptOffer(
    initialOfferId: number,
    acceptOfferData: Omit<ForcedTradeAcceptRecord, 'acceptedAt'>
  ): Promise<ControllerResult> {
    const positionB = await this.stateUpdateRepository.getPositionById(
      acceptOfferData.positionIdB
    )
    const userRegistrationEventB =
      await this.userRegistrationEventRepository.findByStarkKey(
        acceptOfferData.starkKeyB
      )

    if (!positionB || !userRegistrationEventB) {
      return { type: 'not found', content: 'Position does not exist.' }
    }

    const initialOffer = await this.offerRepository.getInitialOfferById(
      initialOfferId
    )

    const offerValidated = validateAcceptOffer(
      initialOffer,
      acceptOfferData,
      positionB,
      userRegistrationEventB.ethAddress
    )

    if (!offerValidated) {
      return { type: 'bad request', content: 'Your offer is invalid' }
    }

    const acceptedAt = Timestamp(Date.now())
    await this.offerRepository.addAcceptOffer(initialOfferId, {
      acceptedAt,
      ...acceptOfferData,
    })

    return { type: 'success', content: 'Accept offer was submitted' }
  }

  // async submitOffer(): ControllerResult {}
}

function validateInitialOffer(
  offer: Omit<ForcedTradeInitialOfferRecord, 'createdAt' | 'id'>,
  position: PositionRecord
) {
  const userIsBuyingSynthetic = offer.aIsBuyingSynthetic

  return validateBalance(offer, position, userIsBuyingSynthetic)
}

function validateAcceptOffer(
  initialOffer: ForcedTradeInitialOfferRecord,
  acceptOffer: Omit<ForcedTradeAcceptRecord, 'acceptedAt'>,
  position: PositionRecord,
  ethAddressB: EthereumAddress
) {
  const userIsBuyingSynthetic = !initialOffer.aIsBuyingSynthetic

  if (validateBalance(initialOffer, position, userIsBuyingSynthetic)) {
    return false
  }

  return validateSignature(initialOffer, acceptOffer, ethAddressB)
}

function validateBalance(
  offer: Omit<ForcedTradeInitialOfferRecord, 'createdAt' | 'id'>,
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

export function validateSignature(
  initialOffer: Omit<ForcedTradeInitialOfferRecord, 'createdAt' | 'id'>,
  acceptOffer: Omit<ForcedTradeAcceptRecord, 'acceptedAt'>,
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
    acceptOffer

  const packedParemeters = solidityPack(
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
    ['FORCED_TRADE', packedParemeters]
  )

  const signedData = solidityKeccak256(
    ['bytes32', 'uint256'],
    [actionHash, submissionExpirationTime]
  )

  const signer = recoverAddress(signedData, signature)

  return signer === ethAddressB.toString()
}
