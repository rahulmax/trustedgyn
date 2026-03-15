import { ImageResponse } from 'next/og'
import { citySlug, getActiveDoctors, getUniqueCities } from '@/lib/utils'

export const runtime = 'edge'
export const alt = 'City directory on TrustedGyn'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

type Props = {
  params: Promise<{ city: string }>
}

export default async function Image({ params }: Props) {
  const { city: slug } = await params
  const cities = getUniqueCities()
  const cityName = cities.find((c) => citySlug(c) === slug)
  const count = cityName
    ? getActiveDoctors().filter((d) => d.city === cityName).length
    : 0

  return new ImageResponse(
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: '#f2f2f2', padding: 60, fontFamily: 'serif' }}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ fontSize: 24, color: '#999999', marginBottom: 12 }}>TrustedGyn</div>
        <div style={{ fontSize: 64, color: '#3a3530', fontWeight: 700, lineHeight: 1.2, marginBottom: 16 }}>
          {cityName || 'City'}
        </div>
        <div style={{ fontSize: 32, color: '#666666' }}>
          {count} community-verified gynaecologists
        </div>
      </div>
      <div style={{ display: 'flex', fontSize: 20, color: '#999999' }}>
        Find a safe, non-judgmental gynaecologist in India
      </div>
    </div>,
    { ...size }
  )
}
