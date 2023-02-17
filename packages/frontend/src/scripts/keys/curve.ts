import { curves, ec as EllipticCurve } from 'elliptic'
import { sha256 } from 'hash.js'

export const EC_ORDER =
  '800000000000010ffffffffffffffffb781126dcae7b2321e66a241adc64d2f'
export const EC_ORDER_INT = BigInt('0x' + EC_ORDER)

export const starkEc = new EllipticCurve(
  new curves.PresetCurve({
    type: 'short',
    prime: null,
    p: '800000000000011000000000000000000000000000000000000000000000001',
    a: '000000000000000000000000000000000000000000000000000000000000001',
    b: '6f21413efbe40de150e596d72f7a8c5609ad26c15c915c1f4cdfcb99cee9e89',
    n: EC_ORDER,
    hash: sha256,
    gRed: false,
    g: [
      '1ef15c18599971b7beced415a40f0c7deacfd9b0d1819e03d723d8bc943cfca',
      '05668060aa49730b7be4801df46ec62de53ecd11abe43a32873000c36e8dc1f',
    ],
  })
)
