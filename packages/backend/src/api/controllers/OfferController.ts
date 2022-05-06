import {
  OfferRecord,
  OfferRepository,
} from '../../peripherals/database/OfferRepository'

export class OfferController {
  constructor(private offerRepository: OfferRepository) {}

  async postOffer(offer: OfferRecord) {
    await this.offerRepository.add([offer])
    return { type: 'created' }
  }
}
