import React from 'react'

interface ArrowProps {
  className?: string
}

export function ArrowLeftIcon(props: ArrowProps & { transform?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
      transform={props.transform}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17.7803 12.9603L13.8686 12.9603L9.64613 12.9603L9.02459 12.9603L12.4363 16.3721C12.8079 16.7437 12.8079 17.345 12.4363 17.7165C12.0648 18.0881 11.4635 18.0881 11.0919 17.7165L6.20059 12.8252C6.13303 12.7847 6.07223 12.7374 6.01818 12.6833C5.84928 12.5144 5.7547 12.2983 5.74118 12.0753L5.74118 12.0618L5.74118 12.0483L5.74118 12.0415L5.74118 12.0213L5.74118 12.001C5.73443 11.751 5.82901 11.501 6.01818 11.3119C6.07223 11.2578 6.13303 11.2105 6.20059 11.17L11.0919 6.27868C11.4635 5.90711 12.0648 5.90711 12.4363 6.27868C12.8079 6.65026 12.8079 7.25154 12.4363 7.62312L8.98405 11.0754L9.64613 11.0754L13.8686 11.0754L17.7803 11.0754C18.3005 11.0754 18.7329 11.501 18.7329 12.028C18.7329 12.5482 18.3073 12.9806 17.7803 12.9806L17.7803 12.9603Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function ArrowRightIcon(props: ArrowProps) {
  return <ArrowLeftIcon {...props} transform="rotate(180)" />
}

export function ArrowUpIcon(props: ArrowProps) {
  return <ArrowLeftIcon {...props} transform="rotate(90)" />
}

export function ArrowDownIcon(props: ArrowProps) {
  return <ArrowLeftIcon {...props} transform="rotate(-90)" />
}
