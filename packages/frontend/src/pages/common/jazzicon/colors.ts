// Based on: https://github.com/MetaMask/jazzicon

export const COLORS = [
  '#01888C', // teal
  '#FC7500', // bright orange
  '#034F5D', // dark teal
  '#F73F01', // orangered
  '#FC1960', // magenta
  '#C7144C', // raspberry
  '#F3C100', // goldenrod
  '#1598F2', // lightning blue
  '#2465E1', // sail blue
  '#F19E02', // gold
]

export function colorRotate(hex: string, degrees: number) {
  const hsl = hexToHSL(hex)
  let hue = hsl.h
  hue = (hue + degrees) % 360
  hue = hue < 0 ? 360 + hue : hue
  hsl.h = hue
  return HSLToHex(hsl)
}

export function hexToHSL(hex: string) {
  // Convert hex to RGB first
  let r = parseInt(hex[1] + hex[2], 16)
  let g = parseInt(hex[3] + hex[4], 16)
  let b = parseInt(hex[5] + hex[6], 16)
  // Then to HSL
  r /= 255
  g /= 255
  b /= 255
  const cMin = Math.min(r, g, b)
  const cMax = Math.max(r, g, b)
  const delta = cMax - cMin
  let h = 0
  let s = 0
  let l = 0

  if (delta == 0) h = 0
  else if (cMax == r) h = ((g - b) / delta) % 6
  else if (cMax == g) h = (b - r) / delta + 2
  else h = (r - g) / delta + 4

  h = Math.round(h * 60)

  if (h < 0) h += 360

  l = (cMax + cMin) / 2
  s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))
  s = +(s * 100).toFixed(1)
  l = +(l * 100).toFixed(1)

  return { h, s, l }
}

export function HSLToHex(hsl: { h: number; s: number; l: number }) {
  // eslint-disable-next-line prefer-const
  let { h, s, l } = hsl
  s /= 100
  l /= 100

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2

  let r = 0
  let g = 0
  let b = 0

  if (0 <= h && h < 60) {
    r = c
    g = x
    b = 0
  } else if (60 <= h && h < 120) {
    r = x
    g = c
    b = 0
  } else if (120 <= h && h < 180) {
    r = 0
    g = c
    b = x
  } else if (180 <= h && h < 240) {
    r = 0
    g = x
    b = c
  } else if (240 <= h && h < 300) {
    r = x
    g = 0
    b = c
  } else if (300 <= h && h < 360) {
    r = c
    g = 0
    b = x
  }

  // Having obtained RGB, convert channels to hex
  const rHex = Math.round((r + m) * 255)
    .toString(16)
    .padStart(2, '0')
  const gHex = Math.round((g + m) * 255)
    .toString(16)
    .padStart(2, '0')
  const bHex = Math.round((b + m) * 255)
    .toString(16)
    .padStart(2, '0')

  return '#' + rHex + gHex + bHex
}
