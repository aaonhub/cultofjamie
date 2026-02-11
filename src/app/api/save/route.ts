import { NextRequest, NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'
import { Dictionary } from '@/lib/types'

function isAuthenticated(request: NextRequest): boolean {
  const session = request.cookies.get('admin-session')?.value
  return !!session && session === process.env.ADMIN_PASSWORD
}

export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
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
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { dictionary, sha } = (await request.json()) as {
      dictionary: Dictionary
      sha: string
    }

    if (!dictionary?.terms || !Array.isArray(dictionary.terms)) {
      return NextResponse.json(
        { error: 'Invalid dictionary format' },
        { status: 400 }
      )
    }

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

    const content = Buffer.from(
      JSON.stringify(dictionary, null, 2),
      'utf-8'
    ).toString('base64')

    await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_OWNER!,
      repo: process.env.GITHUB_REPO!,
      path: 'data/dictionary.json',
      message: `Update dictionary: ${new Date().toISOString()}`,
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
