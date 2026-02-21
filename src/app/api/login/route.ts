import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const PASSWORD = process.env.SITE_PASSWORD || 'changeme'

export async function POST(request: Request) {
  console.log('PASSWORD ENV:', process.env.SITE_PASSWORD)
  const { password } = await request.json()
  console.log('PASSWORD RECU:', password)
  if (password !== PASSWORD) {
    return NextResponse.json({ error: 'Mauvais mot de passe' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set('site-auth', PASSWORD, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 jours
    path: '/',
  })
  return response
}