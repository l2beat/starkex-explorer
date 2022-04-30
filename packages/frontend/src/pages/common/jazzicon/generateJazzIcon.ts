// Based on: https://github.com/MetaMask/jazzicon

import { EthereumAddress } from '@explorer/types'
import MersenneTwister from 'mersenne-twister'

import { colorRotate, COLORS } from './colors'

const SHAPE_COUNT = 4
const WOBBLE = 30

export function jsNumberForAddress(address: EthereumAddress) {
  const addr = address.slice(2, 10)
  const seed = parseInt(addr, 16)
  return seed
}

export function generateJazzIcon(address: EthereumAddress, diameter: number) {
  const seed = jsNumberForAddress(address)
  const generator = new MersenneTwister(seed)
  const colors = hueShift(generator, COLORS.slice())

  const backgroundColor = pickColor(generator, colors)

  const shapes = []
  for (let i = 0; i < SHAPE_COUNT - 1; i++) {
    const shape = genShape(generator, colors, diameter, i, SHAPE_COUNT - 1)
    shapes.push(shape)
  }

  return {
    backgroundColor,
    shapes,
  }
}

function genShape(
  generator: MersenneTwister,
  colors: string[],
  diameter: number,
  index: number,
  maxIndex: number
) {
  const center = diameter / 2

  const firstRot = generator.random()
  const angle = Math.PI * 2 * firstRot
  const velocity =
    (diameter / maxIndex) * generator.random() + (index * diameter) / maxIndex

  const tx = Math.cos(angle) * velocity
  const ty = Math.sin(angle) * velocity

  const translate = 'translate(' + tx + ' ' + ty + ')'

  // Third random is a shape rotation on top of all of that.
  const secondRot = generator.random()
  const rot = firstRot * 360 + secondRot * 180
  const rotate = 'rotate(' + rot.toFixed(1) + ' ' + center + ' ' + center + ')'
  const transform = translate + ' ' + rotate
  const color = pickColor(generator, colors)

  return {
    transform,
    color,
  }
}

function pickColor(generator: MersenneTwister, colors: string[]) {
  generator.random()
  const idx = Math.floor(colors.length * generator.random())
  return colors.splice(idx, 1)[0]
}

function hueShift(generator: MersenneTwister, colors: string[]) {
  const amount = generator.random() * 30 - WOBBLE / 2
  return colors.map((hex) => colorRotate(hex, amount))
}
