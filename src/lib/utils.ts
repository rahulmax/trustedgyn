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

export function getUniqueCities(): string[] {
  const cities = new Set(getActiveDoctors().map((d) => d.city))
  return Array.from(cities).sort()
}
