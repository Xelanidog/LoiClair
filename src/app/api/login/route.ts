import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const PASSWORD = process.env.SITE_PASSWORD || 'changeme'
  const { password } = await request.json()

  console.log('PASSWORD ENV:', process.env.SITE_PASSWORD)
  console.log('PASSWORD RECU:', password)
  console.log('MATCH:', password === PASSWORD)

  if (password !== PASSWORD) {
    return NextResponse.json({ error: 'Mauvais mot de passe' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set('site-auth', PASSWORD, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return response
}