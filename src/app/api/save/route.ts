import { NextRequest, NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'
import { Dictionary } from '@/lib/types'

function getAuth(request: NextRequest): { person: string; role: 'master' | 'person' } | null {
  const session = request.cookies.get('admin-session')?.value
  if (!session) return null

  const passwordsRaw = process.env.ADMIN_PASSWORDS
  if (!passwordsRaw) return null

  try {
    const passwords: Record<string, string> = JSON.parse(passwordsRaw)
    if (session === '_master' && passwords._master) {
      return { person: '_master', role: 'master' }
    }
    if (session in passwords && session !== '_master') {
      return { person: session, role: 'person' }
    }
  } catch {
    return null
  }

  return null
}

export async function GET(request: NextRequest) {
  const auth = getAuth(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })
    const { data } = await octokit.repos.getContent({
      owner: process.env.GITHUB_OWNER!,
      repo: process.env.GITHUB_REPO!,
      path: 'data/dictionary.json',
    })

    if ('content' in data && typeof data.content === 'string') {
      const content = Buffer.from(data.content, 'base64').toString('utf-8')
      return NextResponse.json({
        dictionary: JSON.parse(content) as Dictionary,
        sha: data.sha,
        person: auth.person,
        role: auth.role,
      })
    }

    return NextResponse.json({ error: 'Unexpected response' }, { status: 500 })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch dictionary' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = getAuth(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { dictionary, sha } = (await request.json()) as {
      dictionary: Dictionary
      sha: string
    }

    if (
      !dictionary?.terms || !Array.isArray(dictionary.terms) ||
      !dictionary?.people || !Array.isArray(dictionary.people) ||
      !Array.isArray(dictionary?.faq)
    ) {
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      )
    }

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

    const label = auth.role === 'master' ? 'master' : auth.person
    const content = Buffer.from(
      JSON.stringify(dictionary, null, 2),
      'utf-8'
    ).toString('base64')

    await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_OWNER!,
      repo: process.env.GITHUB_REPO!,
      path: 'data/dictionary.json',
      message: `Update dictionary (${label}): ${new Date().toISOString()}`,
      content,
      sha,
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'status' in error && error.status === 409) {
      return NextResponse.json(
        { error: 'Conflict: dictionary was modified. Please reload and try again.' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to save dictionary' },
      { status: 500 }
    )
  }
}
