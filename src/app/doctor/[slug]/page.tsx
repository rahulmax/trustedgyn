import { notFound } from 'next/navigation'
import { type Metadata } from 'next'
import { DoctorDetail } from '@/components/doctor-detail'
import { BADGE_CONFIG } from '@/lib/badges'
import { findDoctorBySlug, doctorSlug, getActiveDoctors } from '@/lib/utils'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const doctor = findDoctorBySlug(slug)
  if (!doctor) return {}

  const badgeText = doctor.badges
    .slice(0, 3)
    .map((b) => BADGE_CONFIG[b]?.label || b)
    .join(', ')

  const description = badgeText
    ? `${badgeText} gynaecologist in ${doctor.locality}, ${doctor.city}. Community-verified on TrustedGyn.`
    : `Trusted gynaecologist in ${doctor.locality}, ${doctor.city}. Community-verified on TrustedGyn.`

  return {
    title: `${doctor.name} — Trusted Gynaecologist in ${doctor.city} | TrustedGyn`,
    description,
    alternates: { canonical: `/doctor/${doctorSlug(doctor)}` },
    openGraph: {
      title: `${doctor.name} — Trusted Gynaecologist in ${doctor.city}`,
      description,
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${doctor.name} — Trusted Gynaecologist in ${doctor.city}`,
      description,
    },
  }
}

export async function generateStaticParams() {
  return getActiveDoctors().map((doctor) => ({
    slug: doctorSlug(doctor),
  }))
}

export default async function DoctorPage({ params }: Props) {
  const { slug } = await params
  const doctor = findDoctorBySlug(slug)
  if (!doctor) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Physician',
    name: doctor.name,
    medicalSpecialty: 'Gynecology',
    url: `https://trustedgyn.com/doctor/${doctorSlug(doctor)}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: doctor.address,
      addressLocality: doctor.locality,
      addressRegion: doctor.city,
      addressCountry: 'IN',
    },
    ...(doctor.phone ? { telephone: doctor.phone } : {}),
    ...(doctor.geo
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: doctor.geo.lat,
            longitude: doctor.geo.lng,
          },
        }
      : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DoctorDetail doctor={doctor} onBack="/" />
    </>
  )
}
