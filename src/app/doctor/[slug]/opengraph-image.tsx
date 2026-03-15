import { ImageResponse } from 'next/og'
import { BADGE_CONFIG } from '@/lib/badges'
import { findDoctorBySlug } from '@/lib/utils'

export const runtime = 'edge'
export const alt = 'Doctor profile on TrustedGyn'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

type Props = {
  params: Promise<{ slug: string }>
}

export default async function Image({ params }: Props) {
  const { slug } = await params
  const doctor = findDoctorBySlug(slug)

  if (!doctor) {
    return new ImageResponse(
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: '#f2f2f2', color: '#3a3530', fontSize: 48 }}>
        TrustedGyn
      </div>,
      { ...size }
    )
  }

  const badges = doctor.badges.slice(0, 4).map((b) => BADGE_CONFIG[b]?.label || b)

  return new ImageResponse(
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: '#f2f2f2', padding: 60, fontFamily: 'serif' }}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ fontSize: 24, color: '#999999', marginBottom: 12 }}>TrustedGyn</div>
        <div style={{ fontSize: 56, color: '#3a3530', fontWeight: 700, lineHeight: 1.2, marginBottom: 16 }}>
          {doctor.name}
        </div>
        <div style={{ fontSize: 28, color: '#666666', marginBottom: 32 }}>
          {doctor.locality}, {doctor.city}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {badges.map((badge) => (
            <div key={badge} style={{ display: 'flex', background: '#3a3530', color: '#ffffff', padding: '8px 20px', borderRadius: 20, fontSize: 20 }}>
              {badge}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', fontSize: 20, color: '#999999' }}>
        Community-verified gynaecologist directory
      </div>
    </div>,
    { ...size }
  )
}
