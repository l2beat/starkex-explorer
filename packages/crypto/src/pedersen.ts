import BN from 'bn.js'

import { starkCurvePoint } from './curve'

function toPoint(a: string, b: string) {
  return starkCurvePoint(new BN(a, 16), new BN(b, 16))
}

const points = [
  toPoint(
    '49ee3eba8c1600700ee1b87eb599f16716b0b1022947733551fde4050ca6804',
    '3ca0cfe4b3bc6ddf346d49d06ea0ed34e621062c0e056c1d0405d266e10268a'
  ),
  toPoint(
    '234287dcbaffe7f969c748655fca9e58fa8120b6d56eb0c1080d17957ebe47b',
    '3b056f100f96fb21e889527d41f4e39940135dd7a6c94cc6ed0268ee89e5615'
  ),
  toPoint(
    '4fa56f376c83db33f9dab2656558f3399099ec1de5e3018b7a6932dba8aa378',
    '3fa0984c931c9e38113e0c0e47e4401562761f92a7a23b45168f4e80ff5b54d'
  ),
  toPoint(
    '4ba4cc166be8dec764910f75b45f74b40c690c74709e90f3aa372f0bd2d6997',
    '040301cf5c1751f4b971e46c4ede85fcac5c59a5ce5ae7c48151f27b24b219c'
  ),
  toPoint(
    '54302dcb0e6cc1c6e44cca8f61a63bb2ca65048d53fb325d36ff12c49a58202',
    '1b77b3e37d13504b348046268d8ae25ce98ad783c25561a879dcc77e99c2426'
  ),
]

const BN_248 = new BN(
  '100000000000000000000000000000000000000000000000000000000000000',
  16
)

export function pedersen(a: string, b: string) {
  const aBN = new BN(a, 16)
  const bBN = new BN(b, 16)
  const aHigh = aBN.shrn(248)
  const aLow = aBN.sub(aHigh.mul(BN_248))
  const bHigh = bBN.shrn(248)
  const bLow = bBN.sub(bHigh.mul(BN_248))
  const point = points[0]
    .add(points[1].mul(aLow))
    .add(points[2].mul(aHigh))
    .add(points[3].mul(bLow))
    .add(points[4].mul(bHigh))
  return point.getX().toString(16)
}
