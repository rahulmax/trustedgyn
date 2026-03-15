import doctors from '@/data/doctors.json'
import { type Doctor } from '@/lib/types'

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function doctorSlug(doctor: { id: number; name: string }): string {
  return `${doctor.id}-${slugify(doctor.name)}`
}

export function citySlug(city: string): string {
  return slugify(city)
}

const EXCLUDED_FLAGS = new Set(['deceased', 'retired', 'placeholder', 'wrong-specialty'])

export function isActiveDoctorFlag(dataFlag?: string): boolean {
  if (!dataFlag) return true
  return !EXCLUDED_FLAGS.has(dataFlag)
}

export function findDoctorBySlug(slug: string): Doctor | undefined {
  const id = parseInt(slug, 10)
  if (isNaN(id)) return undefined
  const doctor = (doctors as Doctor[]).find((d) => d.id === id)
  if (!doctor) return undefined
  if (!isActiveDoctorFlag(doctor.dataFlag)) return undefined
  return doctor
}

export function getActiveDoctors(): Doctor[] {
  return (doctors as Doctor[]).filter((d) => isActiveDoctorFlag(d.dataFlag))
}

const JUNK_TESTIMONIALS = new Set([
  'maybe', 'probably yes', 'probably not', 'yes', 'no', 'not sure',
])

export function isValidTestimonial(text: string): boolean {
  return text.length > 0 && !JUNK_TESTIMONIALS.has(text.toLowerCase().trim())
}

export function getValidTestimonials(testimonial: string | string[]): string[] {
  const all = Array.isArray(testimonial) ? testimonial : [testimonial]
  return all.filter((t) => t && isValidTestimonial(t))
}

export function getUniqueCities(): string[] {
  const cities = new Set(getActiveDoctors().map((d) => d.city))
  return Array.from(cities).sort()
}
