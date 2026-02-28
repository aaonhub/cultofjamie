import { NextRequest, NextResponse } from 'next/server'
import { searchChats, getChannels } from '@/lib/chatSearch'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const query = params.get('q') || ''
  const channel = params.get('channel')
  const limit = parseInt(params.get('limit') || '50', 10)
  const offset = parseInt(params.get('offset') || '0', 10)

  if (!query.trim()) {
    return NextResponse.json(
      {
        usage:
          'GET /api/search?q=keyword&channel=Jamie&limit=50&offset=0',
        description:
          'Search chat logs by keyword. All keywords must appear in a message (AND logic). Returns matching messages with author, topic, timestamp, and channel.',
        parameters: {
          q: 'Search keywords (required). Space-separated terms are ANDed together.',
          channel:
            'Filter by channel name (optional). Available: ' +
            getChannels().join(', '),
          limit:
            'Max results to return, 1-100 (default 50).',
          offset:
            'Skip this many results for pagination (default 0).',
        },
        channels: getChannels(),
      },
      { status: 200 }
    )
  }

  const result = searchChats(query, channel, limit, offset)

  return NextResponse.json(result)
}
