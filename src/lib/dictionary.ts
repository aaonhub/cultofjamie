import fs from 'fs'
import path from 'path'
import { Dictionary } from './types'

export function getDictionary(): Dictionary {
  const filePath = path.join(process.cwd(), 'data', 'dictionary.json')
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw) as Dictionary
}
