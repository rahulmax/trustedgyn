import { notFound } from 'next/navigation'
import { type Metadata } from 'next'
import doctors from '@/data/doctors.json'
import { Directory } from '@/components/directory'
import { type Doctor } from '@/lib/types'
import { citySlug, getActiveDoctors, getUniqueCities } from '@/lib/utils'

type Props = {
  params: Promise<{ city: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: slug } = await params
  const cities = getUniqueCities()
  const cityName = cities.find((c) => citySlug(c) === slug)
  if (!cityName) return {}

  const count = getActiveDoctors().filter((d) => d.city === cityName).length

  return {
    title: `Trusted Gynaecologists in ${cityName} | TrustedGyn`,
    description: `Find ${count} community-verified, non-judgmental gynaecologists in ${cityName}.`,
    alternates: { canonical: `/city/${slug}` },
    openGraph: {
      title: `Trusted Gynaecologists in ${cityName}`,
      description: `Find ${count} community-verified, non-judgmental gynaecologists in ${cityName}.`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `Trusted Gynaecologists in ${cityName}`,
      description: `Find ${count} community-verified, non-judgmental gynaecologists in ${cityName}.`,
    },
  }
}

export async function generateStaticParams() {
  return getUniqueCities().map((city) => ({
    city: citySlug(city),
  }))
}

export default async function CityPage({ params }: Props) {
  const { city: slug } = await params
  const cities = getUniqueCities()
  const cityName = cities.find((c) => citySlug(c) === slug)
  if (!cityName) notFound()

  return <Directory doctors={doctors as Doctor[]} defaultCity={cityName} />
}
