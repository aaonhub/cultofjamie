import fs from 'fs'
import path from 'path'
import { SiteData } from './types'

export function getSiteData(): SiteData {
  const filePath = path.join(process.cwd(), 'data', 'dictionary.json')
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw) as SiteData
}
