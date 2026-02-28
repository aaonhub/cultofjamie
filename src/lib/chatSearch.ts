import fs from 'fs'
import path from 'path'

export interface ChatMessage {
  id: string
  content: string
  author: string
  timestamp: string
  topic: string
  channel: string
}

export interface SearchResult {
  query: string
  channel: string | null
  total: number
  limit: number
  offset: number
  results: ChatMessage[]
}

interface RawMessage {
  id: string
  content: string
  userName?: string
  author?: { global_name?: string; username?: string }
  timestamp: string
}

let cachedMessages: ChatMessage[] | null = null

function loadAllMessages(): ChatMessage[] {
  if (cachedMessages) return cachedMessages

  const dataDir = path.join(process.cwd(), 'data')
  const messages: ChatMessage[] = []

  const channels = fs.readdirSync(dataDir).filter((entry) => {
    const full = path.join(dataDir, entry)
    return fs.statSync(full).isDirectory()
  })

  for (const channel of channels) {
    const channelDir = path.join(dataDir, channel)
    const files = fs.readdirSync(channelDir).filter((f) => f.endsWith('.json'))

    for (const file of files) {
      // Derive topic from filename: "Some topic_page_1.json" -> "Some topic"
      const topic = file.replace(/_page_\d+\.json$/, '').replace(/!/g, '?')

      const raw = fs.readFileSync(path.join(channelDir, file), 'utf-8')
      let parsed: RawMessage[]
      try {
        parsed = JSON.parse(raw)
      } catch {
        continue
      }

      for (const msg of parsed) {
        if (!msg.content || !msg.content.trim()) continue
        const author =
          msg.userName ||
          msg.author?.global_name ||
          msg.author?.username ||
          'Unknown'
        messages.push({
          id: msg.id,
          content: msg.content,
          author,
          timestamp: msg.timestamp,
          topic,
          channel,
        })
      }
    }
  }

  // Sort by timestamp descending (newest first)
  messages.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  cachedMessages = messages
  return messages
}

export function searchChats(
  query: string,
  channel?: string | null,
  limit = 50,
  offset = 0
): SearchResult {
  const messages = loadAllMessages()
  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((k) => k.length > 0)

  let filtered = messages

  if (channel) {
    const ch = channel.toLowerCase()
    filtered = filtered.filter((m) => m.channel.toLowerCase() === ch)
  }

  if (keywords.length > 0) {
    filtered = filtered.filter((m) => {
      const text = m.content.toLowerCase()
      return keywords.every((kw) => text.includes(kw))
    })
  }

  const total = filtered.length
  const clamped = Math.min(Math.max(limit, 1), 100)
  const results = filtered.slice(offset, offset + clamped)

  return {
    query,
    channel: channel || null,
    total,
    limit: clamped,
    offset,
    results,
  }
}

export function getChannels(): string[] {
  const dataDir = path.join(process.cwd(), 'data')
  return fs.readdirSync(dataDir).filter((entry) => {
    const full = path.join(dataDir, entry)
    return fs.statSync(full).isDirectory()
  })
}
