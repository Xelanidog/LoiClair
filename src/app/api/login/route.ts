import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const PASSWORD = process.env.SITE_PASSWORD
  const { password } = await request.json()

  if (password !== PASSWORD) {
    return NextResponse.json({ error: 'Mauvais mot de passe' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
 response.cookies.set('site-auth', PASSWORD!, {
  httpOnly: true,
  path: '/',
})
  return response
}