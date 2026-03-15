import type { Metadata, Viewport } from 'next'
import { Alegreya, Alegreya_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
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
  style: ['normal', 'italic'],
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
        <svg className="pointer-events-none fixed inset-0 z-[9999] h-full w-full opacity-[0.035] dark:opacity-[0.04]" aria-hidden="true">
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
        <TranslationProvider>
          {children}
        </TranslationProvider>
        <Analytics />
      </body>
    </html>
  )
}
