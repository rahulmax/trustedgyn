# SEO & Shareability Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every doctor and city on TrustedGyn individually addressable, shareable, and indexable by search engines.

**Architecture:** Add dynamic routes for doctors (`/doctor/[slug]`) and cities (`/city/[city]`), reusing existing UI components. Each page gets server-rendered HTML, dynamic OG metadata with generated images, and schema.org structured data. Expanded sitemap covers all ~390 pages.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind 4, `@vercel/og` (ImageResponse)

**Spec:** `docs/superpowers/specs/2026-03-15-seo-shareability-design.md`

---

## File Structure

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/lib/utils.ts` | `slugify()`, `doctorSlug()`, `citySlug()`, `findDoctorBySlug()` helpers |
| Create | `src/app/doctor/[slug]/page.tsx` | Doctor profile page (server component + generateMetadata + generateStaticParams) |
| Create | `src/app/doctor/[slug]/opengraph-image.tsx` | Dynamic OG image for doctor pages |
| Create | `src/app/city/[city]/page.tsx` | City directory page (server component + generateMetadata + generateStaticParams) |
| Create | `src/app/city/[city]/opengraph-image.tsx` | Dynamic OG image for city pages |
| Modify | `src/components/directory.tsx` | Add `defaultCity` prop |
| Modify | `src/components/doctor-detail.tsx` | Add share button, "View full page" link, support string `onBack` |
| Modify | `src/components/doctor-card.tsx` | Add city name to card, link to `/city/[slug]` |
| Modify | `src/app/sitemap.ts` | Expand to ~390 URLs |
| Verify | `src/app/robots.ts` | Already references sitemap — no changes needed |

---

## Chunk 1: Slug Utilities & Doctor Route

### Task 1: Slug utility functions

**Files:**
- Create: `src/lib/utils.ts`

- [ ] **Step 1: Create the utils file with slug helpers**

```typescript
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
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/rahul/Projects/trustedgyn && pnpm build --no-lint 2>&1 | head -20`
Expected: No TypeScript errors related to utils.ts

- [ ] **Step 3: Commit**

```bash
git add src/lib/utils.ts
git commit -m "feat: add slug utility functions for doctor and city routes"
```

---

### Task 2: Doctor profile page

**Files:**
- Create: `src/app/doctor/[slug]/page.tsx`
- Modify: `src/components/doctor-detail.tsx` (onBack prop type)

- [ ] **Step 1: Create the doctor page**

Note: This uses `BADGE_CONFIG` from `src/lib/badges.ts` which already has label fields for each badge — no need for a duplicate `badgeLabels` map.

```typescript
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
```

- [ ] **Step 2: Update DoctorDetail to accept string or function for onBack**

In `src/components/doctor-detail.tsx`, make these exact changes:

**2a. Add Link import** (line 4 area, with other imports):
```typescript
import Link from 'next/link'
```

**2b. Change props type** (lines 16-19):
```typescript
// Change from:
type DoctorDetailProps = {
  doctor: Doctor
  onBack: () => void
}

// Change to:
type DoctorDetailProps = {
  doctor: Doctor
  onBack: (() => void) | string
}
```

**2c. Add a BackLink helper** inside the component, right after the `useTranslation` line (after line 50):
```typescript
const BackLink = ({ className }: { className: string }) =>
  typeof onBack === 'string' ? (
    <Link href={onBack} className={className}>
      <ArrowLeft size={18} />
      <span>{t('backToResults')}</span>
    </Link>
  ) : (
    <button type="button" onClick={onBack} className={className}>
      <ArrowLeft size={18} />
      <span>{t('backToResults')}</span>
    </button>
  )
```

**2d. Replace top back button** (lines 60-67):
```tsx
// Replace:
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 px-1 py-4 text-[15px] text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft size={18} />
        <span>{t('backToResults')}</span>
      </button>

// With:
      <BackLink className="flex items-center gap-2 px-1 py-4 text-[15px] text-text-secondary transition-colors hover:text-text-primary" />
```

**2e. Replace bottom back button** (lines 344-351):
```tsx
// Replace:
      <button
        type="button"
        onClick={onBack}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-[18px] bg-card py-3.5 text-[15px] font-semibold text-text-secondary shadow-sm transition-colors hover:text-text-primary"
      >
        <ArrowLeft size={16} />
        <span>{t('backToResults')}</span>
      </button>

// With:
      <BackLink className="mt-4 flex w-full items-center justify-center gap-2 rounded-[18px] bg-card py-3.5 text-[15px] font-semibold text-text-secondary shadow-sm transition-colors hover:text-text-primary" />
```

- [ ] **Step 3: Build and verify**

Run: `cd /Users/rahul/Projects/trustedgyn && pnpm build 2>&1 | tail -20`
Expected: Build succeeds. The `/doctor/[slug]` route appears in the output.

- [ ] **Step 4: Verify a doctor page renders**

Run: `cd /Users/rahul/Projects/trustedgyn && pnpm dev &` (if not already running)
Visit: `http://localhost:3000/doctor/1-renu-jhamb`
Expected: Full doctor profile page with name, badges, contact info, inclusivity Q&A. Back link goes to `/`.

- [ ] **Step 5: Verify 404 for invalid/excluded slugs**

Visit: `http://localhost:3000/doctor/99999-nobody` — expect 404
Visit: `http://localhost:3000/doctor/abc` — expect 404
If any doctor has `dataFlag: 'deceased'`, visit their slug — expect 404.

- [ ] **Step 6: Commit**

```bash
git add src/app/doctor/[slug]/page.tsx src/components/doctor-detail.tsx
git commit -m "feat: add individual doctor profile pages with SEO metadata and JSON-LD"
```

---

## Chunk 2: City Route & Directory defaultCity

### Task 3: Add defaultCity prop to Directory

**Files:**
- Modify: `src/components/directory.tsx`

- [ ] **Step 1: Add defaultCity prop**

In `src/components/directory.tsx`, make these changes:

**1a. Update the props type** (lines 18-20):
```typescript
// Change from:
type DirectoryProps = {
  doctors: Doctor[]
}

// Change to:
type DirectoryProps = {
  doctors: Doctor[]
  defaultCity?: string
}
```

**1b. Update the function signature** (find `export function Directory`):
```typescript
// Change from:
export function Directory({ doctors }: DirectoryProps) {

// Change to:
export function Directory({ doctors, defaultCity }: DirectoryProps) {
```

**1c. Update selectedCity initial state** (find `useState('')` for selectedCity):
```typescript
// Change from:
const [selectedCity, setSelectedCity] = useState('')

// Change to:
const [selectedCity, setSelectedCity] = useState(defaultCity ?? '')
```

- [ ] **Step 2: Build and verify homepage still works**

Run: `cd /Users/rahul/Projects/trustedgyn && pnpm build 2>&1 | tail -10`
Expected: Build succeeds. Homepage renders as before (defaultCity is undefined, so `selectedCity` starts as `''`).

- [ ] **Step 3: Commit**

```bash
git add src/components/directory.tsx
git commit -m "feat: add defaultCity prop to Directory component"
```

---

### Task 4: City page route

**Files:**
- Create: `src/app/city/[city]/page.tsx`

- [ ] **Step 1: Create the city page**

```typescript
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
```

- [ ] **Step 2: Build and verify**

Run: `cd /Users/rahul/Projects/trustedgyn && pnpm build 2>&1 | tail -20`
Expected: Build succeeds. `/city/[city]` route appears.

- [ ] **Step 3: Verify a city page renders**

Visit: `http://localhost:3000/city/mumbai`
Expected: Directory page with Mumbai pre-selected in the city picker. Only Mumbai doctors shown.

Visit: `http://localhost:3000/city/nonexistent` — expect 404.

- [ ] **Step 4: Commit**

```bash
git add src/app/city/[city]/page.tsx
git commit -m "feat: add city directory pages with pre-selected city filter"
```

---

## Chunk 3: OG Images

### Task 5: Doctor OG image

**Files:**
- Create: `src/app/doctor/[slug]/opengraph-image.tsx`

- [ ] **Step 1: Create the OG image generator**

Uses `BADGE_CONFIG` from `src/lib/badges.ts` for badge labels (same source as doctor page — no duplication).

```tsx
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
```

- [ ] **Step 2: Build and verify**

Run: `cd /Users/rahul/Projects/trustedgyn && pnpm build 2>&1 | tail -20`
Expected: Build succeeds.

- [ ] **Step 3: Test OG image renders**

Visit: `http://localhost:3000/doctor/1-renu-jhamb/opengraph-image`
Expected: A 1200x630 PNG image with doctor name, location, and badges on a warm off-white background.

- [ ] **Step 4: Commit**

```bash
git add src/app/doctor/[slug]/opengraph-image.tsx
git commit -m "feat: add dynamic OG images for doctor profile pages"
```

---

### Task 6: City OG image

**Files:**
- Create: `src/app/city/[city]/opengraph-image.tsx`

- [ ] **Step 1: Create the city OG image generator**

```tsx
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
```

- [ ] **Step 2: Build and verify**

Run: `cd /Users/rahul/Projects/trustedgyn && pnpm build 2>&1 | tail -20`
Expected: Build succeeds.

- [ ] **Step 3: Test OG image**

Visit: `http://localhost:3000/city/mumbai/opengraph-image`
Expected: A 1200x630 PNG with "Mumbai" and doctor count.

- [ ] **Step 4: Commit**

```bash
git add src/app/city/[city]/opengraph-image.tsx
git commit -m "feat: add dynamic OG images for city directory pages"
```

---

## Chunk 4: Sitemap, Internal Linking & Share Button

### Task 7: Expand sitemap

**Files:**
- Modify: `src/app/sitemap.ts`

- [ ] **Step 1: Rewrite sitemap to include all pages**

Replace the contents of `src/app/sitemap.ts`:

```typescript
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
```

- [ ] **Step 2: Build and verify sitemap**

Run: `cd /Users/rahul/Projects/trustedgyn && pnpm build 2>&1 | tail -10`
Then visit: `http://localhost:3000/sitemap.xml`
Expected: XML with ~390 URLs — homepage, 41 city pages, ~340 doctor pages.

- [ ] **Step 3: Commit**

```bash
git add src/app/sitemap.ts
git commit -m "feat: expand sitemap to include all doctor and city pages"
```

---

### Task 8: Share button in DoctorDetail

**Files:**
- Modify: `src/components/doctor-detail.tsx`

Note: `useState` is already imported at line 3. `Link` was already imported in Task 2. Do not add duplicate imports.

- [ ] **Step 1: Add share icon import**

Add `Share2` to the existing lucide-react import (line 5-10):

```typescript
// Add Share2 to the existing import:
import {
  ArrowLeft, MapPin, Building2, Clock, IndianRupee,
  Languages, Wallet, Phone, Map, ExternalLink, ShieldCheck,
  Users, Check, Minus, HelpCircle, ChevronLeft, ChevronRight,
  BadgeCheck, Briefcase, Stethoscope, Share2,
} from 'lucide-react'
```

- [ ] **Step 2: Add share state and handler**

Add these after the `testimonialIndex` state (after line 56):

```typescript
import { doctorSlug } from '@/lib/utils'
// (add this import at the top with other imports)

// Inside the component:
const permalink = `/doctor/${doctorSlug(doctor)}`
const fullUrl = `https://trustedgyn.com${permalink}`
const [copied, setCopied] = useState(false)

const handleShare = async () => {
  if (navigator.share) {
    await navigator.share({ title: doctor.name, url: fullUrl })
  } else {
    await navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
}
```

- [ ] **Step 3: Add share button to action grid and fix grid columns**

The current action button grid (line 184) is:
```tsx
<div className={`grid gap-3 overflow-hidden ${doctor.practoUrl ? 'grid-cols-3' : 'grid-cols-2'}`}>
```

Change to `flex flex-wrap` to accommodate the variable number of buttons cleanly:
```tsx
<div className="flex flex-wrap gap-3">
```

Each button inside gets `flex-1 min-w-[calc(50%-6px)]` to ensure 2 per row minimum:

Update the Call button className to add `flex-1 min-w-[calc(50%-6px)]`:
```tsx
className="flex flex-1 min-w-[calc(50%-6px)] items-center justify-center gap-2 rounded-[12px] bg-call-bg py-3 text-[15px] font-semibold text-call transition-colors hover:opacity-80"
```

Same for Maps and Practo buttons — add `flex-1 min-w-[calc(50%-6px)]` to each.

Then add the Share button after the Practo button (inside the same flex container):
```tsx
<button
  onClick={handleShare}
  className="flex flex-1 min-w-[calc(50%-6px)] items-center justify-center gap-2 rounded-[12px] bg-card-inset py-3 text-[15px] font-semibold text-text-secondary transition-colors hover:opacity-80"
>
  <Share2 size={16} />
  <span>{copied ? 'Copied!' : 'Share'}</span>
</button>
```

- [ ] **Step 4: Add "View full page" link below action buttons**

After the closing `</div>` of the action buttons section (after line 221), add:

```tsx
{typeof onBack === 'function' && (
  <div className="px-5 pb-2">
    <Link
      href={permalink}
      className="mt-2 block text-center text-sm text-text-muted underline underline-offset-2 hover:text-text-secondary"
    >
      View full page →
    </Link>
  </div>
)}
```

- [ ] **Step 5: Build and verify**

Run: `cd /Users/rahul/Projects/trustedgyn && pnpm build 2>&1 | tail -10`
Expected: Build succeeds.

- [ ] **Step 6: Test share button in modal**

Visit: `http://localhost:3000`, click a doctor card. In the detail modal:
- Share button should appear in the action row alongside Call/Maps/Practo
- Clicking it copies the doctor URL to clipboard (or opens native share sheet on mobile)
- "View full page →" link appears below the action buttons

- [ ] **Step 7: Test share button on standalone page**

Visit: `http://localhost:3000/doctor/1-renu-jhamb`
- Share button should appear
- "View full page →" link should NOT appear (onBack is a string, not a function)

- [ ] **Step 8: Commit**

```bash
git add src/components/doctor-detail.tsx
git commit -m "feat: add share button and permalink to doctor detail view"
```

---

### Task 9: City links in DoctorCard

**Files:**
- Modify: `src/components/doctor-card.tsx`

The current card shows `doctor.locality` and `doctor.fee` but does NOT show the city name. We need to add the city to the location line and make it a link.

- [ ] **Step 1: Add imports**

Add at the top of `doctor-card.tsx`:

```typescript
import Link from 'next/link'
import { citySlug } from '@/lib/utils'
```

- [ ] **Step 2: Add city to the location line**

Find the location display (around line 52-58):
```tsx
{(doctor.locality || doctor.fee) && (
  <div className="flex items-center gap-2 text-[15px] text-text-secondary">
    <MapPin size={15} color="#999" className="shrink-0" />
    <span>
      {[doctor.locality, doctor.fee].filter(Boolean).join(' · ')}
    </span>
  </div>
)}
```

Replace with:
```tsx
{(doctor.locality || doctor.city || doctor.fee) && (
  <div className="flex items-center gap-2 text-[15px] text-text-secondary">
    <MapPin size={15} color="#999" className="shrink-0" />
    <span>
      {doctor.locality && <>{doctor.locality} · </>}
      <Link
        href={`/city/${citySlug(doctor.city)}`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        className="underline underline-offset-2 hover:text-text-primary"
      >
        {doctor.city}
      </Link>
      {doctor.fee && <> · {doctor.fee}</>}
    </span>
  </div>
)}
```

Note: `onKeyDown` stopPropagation is needed because the card has a keyboard handler for Enter/Space.

- [ ] **Step 3: Build and verify**

Run: `cd /Users/rahul/Projects/trustedgyn && pnpm build 2>&1 | tail -10`
Expected: Build succeeds.

- [ ] **Step 4: Test city links**

Visit: `http://localhost:3000`. On a doctor card, click the city name.
Expected: Navigates to `/city/{slug}` — not the detail modal.

Verify keyboard: tab to city link, press Enter — should navigate to city page.

- [ ] **Step 5: Commit**

```bash
git add src/components/doctor-card.tsx
git commit -m "feat: add city links to doctor cards"
```

---

### Task 10: Final build verification & lint

- [ ] **Step 1: Run lint**

Run: `cd /Users/rahul/Projects/trustedgyn && pnpm lint`
Expected: No errors. Fix any issues before proceeding.

- [ ] **Step 2: Full production build**

Run: `cd /Users/rahul/Projects/trustedgyn && pnpm build`
Expected: Build succeeds with all routes listed — `/`, `/doctor/[slug]`, `/city/[city]`.

- [ ] **Step 3: Verify key pages**

With `pnpm start` (production mode):
1. Homepage at `/` — works as before
2. Doctor page at `/doctor/1-renu-jhamb` — renders profile with JSON-LD in source
3. City page at `/city/mumbai` — renders directory filtered to Mumbai
4. Sitemap at `/sitemap.xml` — ~390 URLs
5. OG image at `/doctor/1-renu-jhamb/opengraph-image` — renders PNG

- [ ] **Step 4: Verify HTML source for SEO**

Run: `curl -s http://localhost:3000/doctor/1-renu-jhamb | grep -o '<script type="application/ld+json">[^<]*'`
Expected: JSON-LD block with schema.org Physician data.

Run: `curl -s http://localhost:3000/doctor/1-renu-jhamb | grep -o 'og:title" content="[^"]*'`
Expected: `og:title" content="Renu Jhamb — Trusted Gynaecologist in Abohar"`

- [ ] **Step 5: Verify robots.ts**

Visit: `http://localhost:3000/robots.txt`
Expected: Contains `Sitemap: https://trustedgyn.com/sitemap.xml` — already present, no changes needed.

- [ ] **Step 6: Final commit if any lint fixes were needed**

```bash
git add -A
git commit -m "chore: lint fixes"
```
