import type { Metadata, Viewport } from 'next'
import { Alegreya, Alegreya_Sans } from 'next/font/google'
import { TranslationProvider } from '@/lib/translation-context'
import './globals.css'

const alegreya = Alegreya({
  variable: '--font-alegreya',
  subsets: ['latin'],
  display: 'swap',
})

const alegreyaSans = Alegreya_Sans({
  variable: '--font-alegreya-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  display: 'swap',
})

const siteUrl = 'https://trustedgyn.com'

export const metadata: Metadata = {
  title: 'TrustedGyn — Find a Safe, Non-Judgmental Gynaecologist in India',
  description: 'A crowdsourced directory of trusted gynecologists in India who provide respectful, judgment-free care regardless of your lifestyle, identity, or choices.',
  metadataBase: new URL(siteUrl),
  alternates: { canonical: '/' },
  openGraph: {
    title: 'TrustedGyn — Find a Safe, Non-Judgmental Gynaecologist in India',
    description: 'A crowdsourced directory of trusted gynecologists in India who provide respectful, judgment-free care regardless of your lifestyle, identity, or choices.',
    url: siteUrl,
    siteName: 'TrustedGyn',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TrustedGyn — Find a Safe, Non-Judgmental Gynaecologist in India',
    description: 'A crowdsourced directory of trusted gynecologists in India who provide respectful, judgment-free care regardless of your lifestyle, identity, or choices.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${alegreya.variable} ${alegreyaSans.variable} font-sans antialiased`}>
        <TranslationProvider>
          {children}
        </TranslationProvider>
      </body>
    </html>
  )
}
