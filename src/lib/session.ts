import { createHmac } from 'crypto'

const TOKEN_MAX_AGE_S = 60 * 60 * 4 // 4 hours, matches cookie maxAge

function getSecret(): string {
  const secret = process.env.ADMIN_PASSWORDS
  if (!secret) throw new Error('ADMIN_PASSWORDS not configured')
  return secret
}

export function createSessionToken(person: string): string {
  const timestamp = Math.floor(Date.now() / 1000)
  const payload = `${person}:${timestamp}`
  const sig = createHmac('sha256', getSecret())
    .update(payload)
    .digest('hex')
  return `${payload}:${sig}`
}

export function verifySessionToken(
  token: string,
): { person: string } | null {
  const parts = token.split(':')
  if (parts.length !== 3) return null

  const [person, timestampStr, sig] = parts
  const timestamp = Number(timestampStr)
  if (!person || !Number.isFinite(timestamp)) return null

  // Check expiry
  const now = Math.floor(Date.now() / 1000)
  if (now - timestamp > TOKEN_MAX_AGE_S) return null

  // Verify signature
  let expectedSig: string
  try {
    expectedSig = createHmac('sha256', getSecret())
      .update(`${person}:${timestampStr}`)
      .digest('hex')
  } catch {
    return null
  }

  // Timing-safe comparison
  if (sig.length !== expectedSig.length) return null
  const a = Buffer.from(sig, 'hex')
  const b = Buffer.from(expectedSig, 'hex')
  if (a.length !== b.length) return null

  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i]
  }
  if (diff !== 0) return null

  return { person }
}
