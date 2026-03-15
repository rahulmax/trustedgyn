# TrustedGyn: Linkable, Shareable, Findable

**Date:** 2026-03-15
**Status:** Approved
**Goal:** Make every doctor and city on TrustedGyn individually addressable, shareable on social platforms, and indexable by search engines.

---

## Context

TrustedGyn is a single-page app with 347 doctors across 41 Indian cities. Currently:
- No individual doctor URLs — everything is behind a client-side modal
- No city-level URLs — city filtering is a dropdown on the homepage
- Sitemap has 1 entry (the homepage)
- No structured data for search engines
- Sharing on WhatsApp/Twitter shows a generic site preview, not doctor-specific info

The original data comes from a crowdsourced Google Sheet. The creator may link to TrustedGyn from the Sheet, so the site needs to be useful as a link target — not just as a browse-from-homepage experience.

## Design

### 1. URL Structure & Routing

Three route groups in the Next.js App Router:

| Route | Example | Renders |
|-------|---------|---------|
| `/` | `/` | Homepage (unchanged) |
| `/city/[city]` | `/city/mumbai` | Homepage with city pre-selected |
| `/doctor/[slug]` | `/doctor/147-dr-anita-sharma` | Full doctor profile page |

**Doctor slug format:** `{id}-{slugified-name}`
- ID prefix is the unique lookup key (parsed as integer)
- Name suffix is for readability and SEO
- Slugification: lowercase, replace spaces/special chars with hyphens, collapse consecutive hyphens
- Example: Doctor with `id: 147, name: "Dr. Anita Sharma"` becomes `147-dr-anita-sharma`

**City slug format:** Lowercase, hyphenated city name from the `city` field in `doctors.json`.
- Example: `"New Delhi"` becomes `new-delhi`

**Utility:** A shared `slugify` helper in `src/lib/utils.ts` (or similar) generates slugs consistently across pages, sitemap, and links.

### 2. Doctor Profile Page (`/doctor/[slug]`)

A **server component** at `src/app/doctor/[slug]/page.tsx`.

**Data flow:**
1. Parse the numeric ID from the slug prefix
2. Look up the doctor in `doctors.json` by ID
3. Return 404 if not found or if doctor has a disqualifying `dataFlag` (`deceased`, `retired`, `placeholder`, or `wrong-specialty`). Doctors flagged `unverified-specialty` still get pages — the flag indicates uncertainty, not exclusion.
4. Render the profile

**Rendering approach:** The existing `DoctorDetail` is a `'use client'` component (uses `useTranslation` context and `useState` for testimonial carousel). Keep it as a client component and render it inside the server page component. Next.js SSRs client components on first render, so the full HTML is in the initial response — search engines see all content. The `onBack` prop navigates to `/` (or uses `router.back()` if there's history). No need to extract a separate server component.

**What the page shows:**
- Doctor name, qualifications, experience, clinic
- Photo (if available)
- Locality, city, address
- Fee, payment methods, hours, languages
- Inclusivity badges with full Q&A breakdown
- Testimonials
- Contact: phone (tel: link), Google Maps link, Practo link
- Link to original Google Sheet entry

### 3. City Page (`/city/[city]`)

A **server component** at `src/app/city/[city]/page.tsx`.

**Behavior:**
- Lightweight — renders the same `<Directory>` component as the homepage
- Passes `defaultCity` prop so the city picker starts pre-selected
- Returns 404 if the city slug doesn't match any city in the data

**Required change:** Add `defaultCity?: string` to `Directory`'s props and use it as the initial value for the `selectedCity` state (currently hardcoded to `''`).

**SSR note:** `Directory` is a `'use client'` component, but it receives `doctors` as a prop from the server and Next.js SSRs the initial render. The doctor cards will be in the initial HTML and indexable by search engines.

**No new UI.** Same directory layout, just URL-addressable with a pre-applied filter.

### 4. Dynamic OG Meta Tags

Each page gets tailored OpenGraph and Twitter Card metadata via Next.js `generateMetadata`. Since `layout.tsx` already sets `metadataBase: new URL('https://trustedgyn.com')`, child pages can use relative paths for canonical URLs and OG URLs — no need to hardcode the domain in every page.

**Doctor page:**
- Title: `{name} — Trusted Gynaecologist in {city} | TrustedGyn`
- Description: Built from badges + locality. Example: "Queer-friendly, trauma-informed gynaecologist in Andheri, Mumbai. Community-verified on TrustedGyn."
- Canonical URL: `/doctor/{slug}` (resolved against `metadataBase`)

**City page:**
- Title: `Trusted Gynaecologists in {city} | TrustedGyn`
- Description: `Find {count} community-verified, non-judgmental gynaecologists in {city}.`
- Canonical URL: `/city/{city-slug}` (resolved against `metadataBase`)

**Homepage:** Unchanged.

### 5. Dynamic OG Images

Generated using Next.js `ImageResponse` API (the `opengraph-image.tsx` file convention).

**Doctor page OG image:**
- Branded card with TrustedGyn logo/name
- Doctor name, city
- Badge icons/labels (top 3-4 badges)
- Warm color palette matching the site

**City page OG image:**
- City name prominently
- Doctor count
- TrustedGyn branding

These are generated at build/request time — no external image service needed. Uses the `@vercel/og` package (already available in Next.js).

### 6. Structured Data (JSON-LD)

Each doctor page includes a `<script type="application/ld+json">` block with schema.org markup:

```json
{
  "@context": "https://schema.org",
  "@type": "Physician",
  "name": "Dr. Anita Sharma",
  "medicalSpecialty": "Gynecology",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "...",
    "addressLocality": "Andheri",
    "addressRegion": "Mumbai",
    "addressCountry": "IN"
  },
  "telephone": "+91...",
  "url": "https://trustedgyn.com/doctor/147-dr-anita-sharma"
}
```

Only include fields that have data. `telephone` and `geo` (GeoCoordinates) are optional — most doctors lack geo data, so it will only appear on the ~105 records that have it. No fabricated ratings — this is factual directory data only.

### 7. Expanded Sitemap

Update `src/app/sitemap.ts` to dynamically generate entries from `doctors.json`:

- `/` — priority 1.0
- `/city/{slug}` for each unique city — priority 0.8
- `/doctor/{slug}` for each doctor without a disqualifying `dataFlag` (`deceased`, `retired`, `placeholder`, `wrong-specialty`) — priority 0.6

Estimated total: ~390 URLs (1 homepage + 41 cities + ~340 active doctors).

Update `robots.ts` to explicitly reference the sitemap URL.

### 8. Internal Linking

**Homepage behavior:** Keep the existing modal flow. Clicking a `DoctorCard` still opens the `DoctorDetail` modal. Add a share/permalink button inside the modal that copies the doctor's permanent URL (`/doctor/{slug}`) to clipboard.

**City page behavior:** Same as homepage — modal flow with share button.

**New links:**
- `DoctorDetail` modal gets a share button (copy URL to clipboard) and a "View full page" link to `/doctor/{slug}`
- City names in doctor cards become `<Link>` elements pointing to `/city/{slug}`

## What This Does NOT Include

- No new visual design or components (beyond the share button)
- No user accounts, reviews, or community features
- No changes to the AI search functionality
- No changes to the data pipeline or doctor data
- No new API endpoints
- No changes to the translation system

## Success Criteria

- Every active doctor has a unique, shareable URL
- Every city has a unique, shareable URL
- Sharing a doctor link on WhatsApp shows a rich preview card with name, city, and badges
- Google Search Console shows indexed doctor and city pages within 2-4 weeks of deploy
- Sitemap contains ~390 URLs
- All new pages are server-rendered (no client-side data fetching for core content)
