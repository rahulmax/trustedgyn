import { doctorSlug, findDoctorBySlug, getActiveDoctors } from '@/lib/utils'

// One small static JSON file per doctor. The in-page detail view on list
// pages fetches it, so the list doesn't ship every doctor's answers.
export const dynamic = 'force-static'
export const dynamicParams = false

export function generateStaticParams() {
  return getActiveDoctors().map((doctor) => ({ slug: doctorSlug(doctor) }))
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const doctor = findDoctorBySlug(slug)
  if (!doctor) return Response.json(null, { status: 404 })
  return Response.json(doctor.inclusivity)
}
