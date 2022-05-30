const { compileProject } = require('@ethereum-waffle/compiler')

main()
async function main() {
  await compileProject('waffle.json')
}
