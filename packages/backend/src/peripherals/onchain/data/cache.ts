import fs from 'fs'

export function getCache<T>(key: string): T | undefined {
  if (fs.existsSync(`.cache/${key}`)) {
    return JSON.parse(fs.readFileSync(`.cache/${key}`, 'utf-8'))
  }
  return undefined
}

export function setCache(key: string, value: unknown) {
  if (!fs.existsSync('.cache')) {
    fs.mkdirSync('.cache')
  }
  fs.writeFileSync(`.cache/${key}`, JSON.stringify(value))
}
