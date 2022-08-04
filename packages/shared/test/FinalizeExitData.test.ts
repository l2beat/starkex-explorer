import { StarkKey } from "@explorer/types";
import { expect } from "earljs";
import { decodeFinalizeExitRequest, encodeFinalizeExitRequest } from "../src";

// https://etherscan.io/tx/0xb7c13b9f8f9b521669791ef068b03fc8f0744523023ef67fb56484789b338bcc
const exampleData = '0x441a3e70070a6100ed8ef5dd2d61e6d00de188e1ef2ac191f6178d99781150a04e889fd302893294412a4c8f915f75892b395ebbf6859ec246ec365c3b1f56f47c3a0a5d'

const starkKey = StarkKey('0x070A6100ED8EF5DD2D61E6D00DE188E1EF2AC191F6178D99781150A04E889FD3')

describe(encodeFinalizeExitRequest.name, () => {
  it('encodes an example tx', () => {
   expect(encodeFinalizeExitRequest(starkKey)).toEqual(exampleData)
  })
})

describe(decodeFinalizeExitRequest.name, () => {
  it('encodes an example tx', () => {
   expect(decodeFinalizeExitRequest(exampleData)).toEqual(starkKey)
  })
})