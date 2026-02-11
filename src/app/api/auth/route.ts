import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { password } = await request.json()

  const passwordsRaw = process.env.ADMIN_PASSWORDS
  if (!passwordsRaw) {
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    )
  }

  let passwords: Record<string, string>
  try {
    passwords = JSON.parse(passwordsRaw)
  } catch {
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    )
  }

  // Check for master password first
  if (passwords._master && password === passwords._master) {
    const response = NextResponse.json({ success: true, person: '_master', role: 'master' })
    response.cookies.set('admin-session', '_master', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 4,
    })
    return response
  }

  // Find which person this password belongs to
  const person = Object.entries(passwords).find(
    ([key, pass]) => key !== '_master' && pass === password
  )?.[0]

  if (!person) {
    return NextResponse.json(
      { error: 'Invalid password' },
      { status: 401 }
    )
  }

  const response = NextResponse.json({ success: true, person, role: 'person' })

  response.cookies.set('admin-session', person, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 4,
  })

  return response
}
