import { Timestamp } from '@explorer/types'

import {
  OfferRecord,
  OfferRepository,
} from '../../peripherals/database/OfferRepository'

export class OfferController {
  constructor(private offerRepository: OfferRepository) {}

  async postOffer(offer: Omit<OfferRecord, 'createdAt'>) {
    const createdAt = Timestamp(Date.now())

    await this.offerRepository.add([{ createdAt, ...offer }])
    return { type: 'created' }
  }
}
