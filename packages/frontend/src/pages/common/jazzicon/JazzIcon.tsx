import { EthereumAddress } from '@explorer/types'
import cx from 'classnames'
import React from 'react'

import { generateJazzIcon } from './generateJazzIcon'

export interface JazzIconProps {
  address: EthereumAddress
  size: number
  className?: string
}

export function JazzIcon({ address, size, className }: JazzIconProps) {
  const { backgroundColor, shapes } = generateJazzIcon(address, size)
  return (
    <div
      style={{ width: size, height: size, backgroundColor }}
      className={cx('overflow-hidden rounded-full', className)}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {shapes.map(({ color, transform }, i) => (
          <rect
            key={i}
            x={0}
            y={0}
            width={size}
            height={size}
            transform={transform}
            fill={color}
          />
        ))}
      </svg>
    </div>
  )
}
