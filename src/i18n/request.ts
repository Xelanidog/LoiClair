import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'
import { routing } from './routing'

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value

  const headerStore = await headers()
  const acceptLang = headerStore.get('accept-language') ?? ''
  const headerLocale = acceptLang.startsWith('en') ? 'en' : 'fr'

  const locale = cookieLocale && routing.locales.includes(cookieLocale as 'fr' | 'en')
    ? cookieLocale
    : headerLocale

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  }
})
