import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PASSWORD = process.env.SITE_PASSWORD || 'changeme'
const COOKIE_NAME = 'site-auth'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 jours

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Laisser passer la page login et les assets
  if (pathname.startsWith('/login')) {
    return NextResponse.next()
  }

  // Vérifier le cookie
  const cookie = request.cookies.get(COOKIE_NAME)
  if (cookie?.value === PASSWORD) {
    return NextResponse.next()
  }

  // Rediriger vers login
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('from', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}