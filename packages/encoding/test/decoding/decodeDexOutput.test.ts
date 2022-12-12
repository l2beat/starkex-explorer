import { expect } from "earljs";

import { decodeDexOutput } from "../../src";
import DECODED_EXAMPLE from '../data/spot-decoded-example.json'
import ENCODED_EXAMPLE from '../data/spot-encoded-example.json'

describe('decodeOnChainSpotData', () => {
    it('decodes the example data', () => {
        const decoded = decodeDexOutput(ENCODED_EXAMPLE)
        const noBigInt = JSON.parse(
        JSON.stringify(decoded, (k, v) => (typeof v === 'bigint' ? Number(v) : v))
        )
        expect(noBigInt).toEqual(DECODED_EXAMPLE)
    })
})
