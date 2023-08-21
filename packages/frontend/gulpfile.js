const gulp = require('gulp')
const del = require('del')
const child_process = require('child_process')
const path = require('path')
const fs = require('fs')
const { addHashes } = require('./scripts/hashStaticFiles')

async function clean() {
  await del('build')
  await fs.promises.mkdir('build')
}

async function cleanStatic() {
  await del(path.join('build', 'static'))
}

function buildScripts() {
  return exec(
    'esbuild --bundle src/scripts/index.ts --outfile=build/static/scripts/main.js --minify'
  )
}

function watchScripts() {
  return gulp.watch(
    ['src/scripts/**/*.ts', 'src/pages/**/*.{ts,tsx}'],
    buildScripts
  )
}

function buildStyles() {
  const isPreviewDebug =
    process.env.DEPLOYMENT_ENV === 'preview' && process.env.DEBUG === 'true'
  return Promise.all([
    exec(
      'tailwindcss -i ./src/styles/style.css -o ./build/static/styles/main.css'
    ),
    ...(isPreviewDebug
      ? [
          exec(
            'tailwindcss -i ./src/styles/debug.css -o ./build/static/styles/debug.css'
          ),
        ]
      : []),
  ])
}

function watchStyles() {
  return gulp.watch('src/**/*.{css,ts,tsx}', buildStyles)
}

function copyStatic() {
  return gulp.src('src/static/**/*').pipe(gulp.dest('build/static'))
}

function watchStatic() {
  return gulp.watch('src/static/**/*', copyStatic)
}

function buildTypescript() {
  return exec('tsc -p tsconfig.build.json')
}

async function hashStaticFiles() {
  return addHashes({
    buildDir: 'build',
    staticDir: 'build/static',
    staticIgnoreList: ['/favicon.ico'],
  })
}

function startPreview() {
  return exec(
    'nodemon --watch src -e ts,tsx --exec "node -r esbuild-register" src/preview/index.ts'
  )
}

const build = gulp.series(
  cleanStatic,
  gulp.parallel(buildScripts, buildStyles, buildTypescript, copyStatic),
  hashStaticFiles
)

const watch = gulp.series(
  cleanStatic,
  gulp.parallel(buildScripts, buildStyles, copyStatic),
  gulp.parallel(watchScripts, watchStyles, watchStatic, startPreview)
)

module.exports = {
  clean,
  watch,
  build,
}

// Utilities

function exec(command) {
  const nodeModulesHere = path.join(__dirname, './node_modules/.bin')
  const nodeModulesUp = path.join(__dirname, '../node_modules/.bin')
  const PATH = `${nodeModulesHere}:${nodeModulesUp}:${process.env.PATH}`
  const [name, ...args] = parseCommand(command)
  const cp = child_process.spawn(name, args, {
    env: { ...process.env, PATH },
    stdio: 'inherit',
  })
  return new Promise((resolve, reject) => {
    cp.on('error', reject)
    cp.on('exit', (code) => (code !== 0 ? reject(code) : resolve()))
  })
}

function parseCommand(text) {
  const SURROUNDED = /^"[^"]*"$/
  const NOT_SURROUNDED = /^([^"]|[^"].*?[^"])$/

  const args = []
  let argPart = ''

  for (const arg of text.split(' ')) {
    if ((SURROUNDED.test(arg) || NOT_SURROUNDED.test(arg)) && !argPart) {
      args.push(arg)
    } else {
      argPart = argPart ? argPart + ' ' + arg : arg
      if (argPart.endsWith('"')) {
        args.push(argPart.slice(1, -1))
        argPart = ''
      }
    }
  }

  return args
}
