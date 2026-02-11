import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { password } = await request.json()
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminPassword) {
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    )
  }

  if (password !== adminPassword) {
    return NextResponse.json(
      { error: 'Invalid password' },
      { status: 401 }
    )
  }

  const response = NextResponse.json({ success: true })

  response.cookies.set('admin-session', adminPassword, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 4, // 4 hours
  })

  return response
}
