const path = require('path')
const fs = require('fs')
const crypto = require('crypto')

module.exports = { addHashes }

/*
 * This function is used to add hashes to static files.
 * HASH_LENGTH - We are using sha256 so the maximum value can be 16. We are using 8 to keep the file names short. If you want to change this, you need to clean and rebuild the project.
 */
const HASH_LENGTH = 8

async function addHashes({
  buildDir,
  staticDir,
  staticIgnoreList = [],
  patterns = [
    ["'", "'"],
    ['"', '"'],
    ['url(', ')'],
  ],
}) {
  buildDir = path.resolve(buildDir)
  staticDir = path.resolve(staticDir)
  const files = await getFileList(path.resolve(buildDir))

  const toHash = files
    .filter((x) => x.startsWith(staticDir))
    .map((file) => ({ name: file.slice(staticDir.length), file }))
    .filter((x) => !staticIgnoreList.includes(x.name))

  const toProcess = files
    .map((file) => {
      const content = fs.readFileSync(file, 'utf-8')
      const dependencies = []
      const fileDependencies = []
      for (const { name, file } of toHash) {
        for (const [start, end] of patterns) {
          const value = `${start}${name}${end}`
          const isValueInContent = getRegexForDependency(value).test(content)
          if (isValueInContent) {
            dependencies.push(value)
            fileDependencies.push(file)
          }
        }
      }
      return {
        file,
        needsHash: toHash.some((x) => x.file === file),
        dependencies,
        fileDependencies,
        content: dependencies.length !== 0 ? content : '',
      }
    })
    .filter((x) => x.dependencies.length !== 0 || x.needsHash)

  const inOrder = orderByDependencies(toProcess)

  const processed = {}
  for (const item of inOrder) {
    for (const dependency of item.dependencies) {
      item.content = replaceAll(item.content, dependency, processed[dependency])
    }
    if (item.content !== '') {
      fs.writeFileSync(item.file, item.content)
    }

    if (item.needsHash) {
      const hash = (await sha256(item.file)).slice(0, HASH_LENGTH)
      const { name, ext, dir } = path.parse(item.file)
      const base = path.dirname(item.file.slice(staticDir.length))
      const itemWithHash = `${name}.${hash}${ext}`
      await fs.promises.rename(item.file, path.join(dir, itemWithHash))

      const oldName = path.join(base, `${name}${ext}`)
      const newName = path.join(base, itemWithHash)

      for (const [start, end] of patterns) {
        processed[`${start}${oldName}${end}`] = `${start}${newName}${end}`
      }
    }
  }
}

function orderByDependencies(toProcess) {
  const inOrder = []
  while (toProcess.length > 0) {
    let addedAtLeastOne = false
    for (let i = 0; i < toProcess.length; i++) {
      const item = toProcess[i]
      if (
        !item.fileDependencies.every((x) => inOrder.some((y) => y.file === x))
      ) {
        continue
      }
      inOrder.push(item)
      toProcess.splice(i, 1)
      addedAtLeastOne = true
    }
    if (!addedAtLeastOne) {
      console.error(toProcess[0])
      throw new Error('Cannot satisfy dependencies')
    }
  }
  return inOrder
}

async function getFileList(dir) {
  const result = []
  const items = await fs.promises.readdir(dir)
  for (const item of items) {
    const fullName = path.join(dir, item)
    if (fs.statSync(fullName).isDirectory()) {
      result.push(...(await getFileList(fullName)))
    } else {
      result.push(fullName)
    }
  }
  return result
}

async function sha256(file) {
  const fd = fs.createReadStream(file)
  const hash = crypto.createHash('sha256')
  hash.setEncoding('hex')
  return new Promise((resolve) => {
    fd.on('end', function () {
      hash.end()
      resolve(hash.read())
    })
    fd.pipe(hash)
  })
}

function replaceAll(str, find, replace) {
  return str.replace(getRegexForDependency(find), replace)
}

function getRegexForDependency(name) {
  const splittedName = name.split('.')
  const ext = splittedName.pop()
  const nameWithoutExt = splittedName.join('.')
  return new RegExp(
    `${nameWithoutExt}(?:\\.[a-fA-F0-9]{${HASH_LENGTH}})?\\.${ext}`,
    'gm'
  )
}
