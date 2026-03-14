export type BadgeKey =
  | 'queer-friendly'
  | 'reproductive-autonomy'
  | 'trauma-informed'
  | 'accessible'
  | 'financially-considerate'
  | 'confidential-autonomous'
  | 'sex-positive'
  | 'non-traditional-family'

export type InclusivityAnswer = 'Yes' | 'Maybe' | 'No' | ''

export type InclusivityGroup = Record<string, InclusivityAnswer>

export type Doctor = {
  id: number
  name: string
  gender: string
  ageRange: string
  phone: string
  phones?: string[]
  address: string
  locality: string
  hours: string
  fee: string
  payment: string[]
  languages: string[]
  city: string
  wheelchairAccessible: string
  hygienic: string
  testimonial: string | string[]
  responseCount: number
  badges: BadgeKey[]
  inclusivity: Record<BadgeKey, InclusivityGroup>
  sheetUrl: string
  googleMapsUrl?: string
  researchNotes?: string
}
