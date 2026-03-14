import type { Metadata } from 'next'
import { Alegreya, Alegreya_Sans } from 'next/font/google'
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

export const metadata: Metadata = {
  title: 'TrustedGyn',
  description: 'Find trusted gynecologists in India',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${alegreya.variable} ${alegreyaSans.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
