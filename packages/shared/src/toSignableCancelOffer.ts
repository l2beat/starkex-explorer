export function toSignableCancelOffer(offerId: number): string {
  return JSON.stringify(
    {
      cancel: true,
      offerId,
    },
    null,
    2
  )
}
