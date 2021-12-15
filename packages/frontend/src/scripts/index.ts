export {}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const canvas: HTMLCanvasElement = document.querySelector('.Home-Background')!
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const ctx = canvas.getContext('2d')!

interface Ball {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
}

const balls: Ball[] = [
  {
    x: Math.random() * 2 - 1,
    y: Math.random() * 2 - 1,
    vx: 0.2,
    vy: 0.4,
    size: 0.7,
    color: '#7e41cc',
  },
  {
    x: Math.random() * 2 - 1,
    y: Math.random() * 2 - 1,
    vx: -0.4,
    vy: 0.2,
    size: 0.5,
    color: '#d83da4',
  },
  {
    x: Math.random() * 2 - 1,
    y: Math.random() * 2 - 1,
    vx: -0.3,
    vy: -0.3,
    size: 0.6,
    color: '#ee2c01',
  },
  {
    x: Math.random() * 2 - 1,
    y: Math.random() * 2 - 1,
    vx: 0.6,
    vy: -0.1,
    size: 0.3,
    color: '#eec201',
  },
]

let lastTime = Date.now()

render()
function render() {
  const width = window.innerWidth
  const height = window.innerHeight
  if (canvas.width !== width) {
    canvas.width = width
  }
  if (canvas.height !== height) {
    canvas.height = height
  }

  const now = Date.now()
  const delta = (now - lastTime) / 1000
  lastTime = now

  ctx.clearRect(0, 0, width, height)

  ctx.globalCompositeOperation = 'screen'

  const minAxis = Math.min(width, height)
  const halfAxis = minAxis / 2
  for (const ball of balls) {
    ctx.fillStyle = ball.color

    const edgeX = width / minAxis
    const edgeY = height / minAxis

    if (ball.x < -edgeX) {
      ball.x = -edgeX
      ball.vx = Math.abs(ball.vx)
    } else if (ball.x > edgeX) {
      ball.x = edgeX
      ball.vx = -Math.abs(ball.vx)
    }

    if (ball.y < -edgeY) {
      ball.y = -edgeY
      ball.vy = Math.abs(ball.vy)
    } else if (ball.y > edgeY) {
      ball.y = edgeY
      ball.vy = -Math.abs(ball.vy)
    }

    fillCircle(
      ctx,
      width / 2 + ball.x * halfAxis,
      height / 2 + ball.y * halfAxis,
      ball.size * halfAxis
    )

    ball.x += ball.vx * delta
    ball.y += ball.vy * delta
  }

  requestAnimationFrame(render)
}

function fillCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number
) {
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, 2 * Math.PI, false)
  ctx.fill()
}
