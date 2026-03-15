import { type MetadataRoute } from 'next'
import { doctorSlug, citySlug, getActiveDoctors, getUniqueCities } from '@/lib/utils'

export default function sitemap(): MetadataRoute.Sitemap {
  const activeDoctors = getActiveDoctors()
  const cities = getUniqueCities()

  const doctorEntries: MetadataRoute.Sitemap = activeDoctors.map((doctor) => ({
    url: `https://trustedgyn.com/doctor/${doctorSlug(doctor)}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  const cityEntries: MetadataRoute.Sitemap = cities.map((city) => ({
    url: `https://trustedgyn.com/city/${citySlug(city)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [
    {
      url: 'https://trustedgyn.com',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...cityEntries,
    ...doctorEntries,
  ]
}
