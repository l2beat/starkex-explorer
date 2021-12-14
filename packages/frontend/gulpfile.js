const gulp = require('gulp')
const sass = require('gulp-sass')(require('sass'))
const del = require('del')
const child_process = require('child_process')
const path = require('path')
const postcss = require('gulp-postcss')
const autoprefixer = require('autoprefixer')
const cssnano = require('cssnano')

const OUT_PATH = 'build/static'

const SCRIPT_IN_PATH = 'src/scripts/**/*.ts'
const SCRIPT_IN_FILE = 'src/scripts/index.ts'
const SCRIPT_OUT_FILE = `${OUT_PATH}/scripts/main.js`

const STYLE_IN_PATH = 'src/styles/**/*.scss'
const STYLE_OUT_PATH = `${OUT_PATH}/styles`

const STATIC_IN_PATH = 'src/static/**/*'

const PAGES_IN_PATH = 'src/pages/**/*'

function exec(command) {
  const nodeModulesHere = path.join(__dirname, './node_modules/.bin')
  const nodeModulesUp = path.join(__dirname, '../node_modules/.bin')
  const PATH = `${nodeModulesHere}:${nodeModulesUp}:${process.env.PATH}`
  return new Promise((resolve, reject) =>
    child_process.exec(
      command,
      { env: { ...process.env, PATH } },
      (err, stdout, stderr) => {
        stdout && console.log(stdout)
        if (err) {
          stderr && console.error(stderr)
          reject(err)
        } else {
          resolve()
        }
      }
    )
  )
}

function clean() {
  return del(OUT_PATH)
}

function buildScripts() {
  return exec(
    `esbuild --bundle ${SCRIPT_IN_FILE} --outfile=${SCRIPT_OUT_FILE} --minify`
  )
}

function watchScripts() {
  return gulp.watch(SCRIPT_IN_PATH, buildScripts)
}

function buildStyles() {
  return gulp
    .src(STYLE_IN_PATH)
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(postcss([autoprefixer(), cssnano()]))
    .pipe(gulp.dest(STYLE_OUT_PATH))
}

function watchStyles() {
  return gulp.watch(STYLE_IN_PATH, buildStyles)
}

function copyStatic() {
  return gulp.src(STATIC_IN_PATH).pipe(gulp.dest(OUT_PATH))
}

function watchStatic() {
  return gulp.watch(STATIC_IN_PATH, copyStatic)
}

function buildPages() {
  return exec(`tsc -p tsconfig.pages.json`)
}

function watchPages() {
  return gulp.watch(PAGES_IN_PATH, buildPages)
}

const build = gulp.series(
  clean,
  gulp.parallel(buildScripts, buildStyles, buildPages, copyStatic)
)

const watch = gulp.series(
  gulp.parallel(buildScripts, buildStyles, buildPages, copyStatic),
  gulp.parallel(watchScripts, watchStyles, watchPages, watchStatic)
)

module.exports = {
  clean,
  watch,
  build,
}
