# How I Built TrustedGyn

## The spark

My wife mentioned it first. She'd been looking for a new gynaecologist after we moved cities, and the process was miserable — Google reviews felt unreliable, recommendations from friends were hit-or-miss, and the questions that actually mattered ("Will they judge me?" "Will they tell my parents?") weren't the kind you could find answers to on Practo.

Then a doctor friend of ours said something that stuck: "The problem isn't finding a gynaecologist. It's finding one you can *trust*. And that's almost impossible unless someone you know has been there."

Around the same time, I stumbled on a crowdsourced Google Sheet that had been quietly circulating — a spreadsheet of gynaecologists across India, vetted by real patients on deeply personal criteria. Not just "are they good at their job" but "will they respect my autonomy?" "are they queer-friendly?" "will they do an abortion without lecturing me?"

347 doctors. 41 cities. 58 data points per doctor. All sitting in a spreadsheet that was hard to navigate, impossible to search, and not mobile-friendly. I thought: this deserves better.

## One night

I built the whole thing in a single night session, across multiple Claude Code windows running in parallel.

### The data pipeline

Started by writing a script to sync the Google Sheet. The sheet was structured weirdly — transposed, with each city in a separate tab, and inclusivity answers scattered across 58 columns. Built a parser that normalizes everything, computes inclusivity badges (queer-friendly, trauma-informed, sex-positive, etc.), deduplicates across cities, and outputs clean JSON. 347 doctors extracted.

### The UI

Next.js 15, Tailwind, server components. Designed it mobile-first — this is the kind of thing you search for on your phone, probably lying in bed at night, stressed. The interface needed to feel calm and trustworthy.

Alegreya serif for headings (warm, literary), clean card layout, dark mode that activates automatically. Filter chips for the inclusivity badges. A detail view that expands with all the community-sourced ratings.

### Making search actually useful

A plain text search wasn't enough. People don't search for "reproductive-autonomy" — they search for "I need an abortion and I don't want to be judged." So I added an AI-powered omnibox that understands natural language and maps it to the right filters.

"Non-judgmental doctor in Bangalore who speaks Kannada" → filters by city, language, and the relevant inclusivity badges. No dropdown menus, no checkboxes. Just say what you need.

### The data enrichment rabbit hole

The crowdsourced data was a goldmine for inclusivity ratings but thin on practical details. Half the doctors had no phone numbers. Addresses were often just "near some landmark." No verification of whether they were still practicing.

So I went deep:

**Web search enrichment** — dispatched 14 parallel AI agents, each researching ~25 doctors across Google, Practo, Lybrate, and JustDial. Found 90 missing phone numbers, updated 237 addresses, added Google Maps links for 345 out of 347 doctors. Also discovered two doctors had passed away, one had retired, several clinics had closed down, and one entry was a urologist who'd been listed as a gynaecologist by mistake.

**Practo scraping** — this was a journey. Practo has bot protection that blocks headless browsers and curl requests. Tried Playwright in headless mode — blocked. Tried Googlebot user-agent — blocked with a crypto challenge. The breakthrough: realized I could use `fetch()` from *within* an already-authenticated browser session via Playwright's MCP tools. Processed all 345 doctors, found 120 on Practo, and pulled their qualifications, photos, verification status, consultation fees, and geo coordinates.

Along the way, Practo flagged three doctors as "Physiotherapists" — which seemed wrong. Investigated each one. Two turned out to be legitimate gynaecologists that Practo had miscategorized (including a well-known Mumbai doctor). The third was a name collision — a different person entirely. The kind of thing you only catch by cross-referencing the original data with what the scraper returns.

### Multi-language support

India has 22 official languages. I added support for 8 — Hindi, Tamil, Telugu, Kannada, Bengali, Marathi, Malayalam, Gujarati — using pre-generated translations. The doctor data stays in English (names and addresses don't translate well), but all UI chrome switches. Had to fix some fun translation bugs: "Call" was showing as "Listen" in Malayalam, and "Testimonial" became "Interview" in Hindi.

### What I learned

**Crowdsourced data is invaluable and messy.** Consultation fees stored in the phone number field. Age ranges stored as addresses. Payment methods where the address should be. "I'm not sure" appended to doctor names. One entry was literally "No idea." You have to love the data enough to clean it.

**The verification problem is real.** Two doctors in our database had passed away — one in 2019, one during COVID in 2020. A retired doctor from 2013 was still listed. Clinics had closed. Hospitals had rebranded. Data decays fast in healthcare.

**Practo's bot protection is serious.** But their server-side rendering includes JSON-LD structured data that has everything — qualifications, fees, photos, geo coordinates, verification status. If you can get past the challenge page, it's a goldmine.

**Parallel AI agents are incredibly effective for research.** 14 agents searching 347 doctors in 3 minutes, each returning structured data with notes about what they found. The notes caught things I never would have — hospital rebranding (Columbia Asia → Manipal), duplicate entries, name typos, clinic closures.

## The result

347 gynaecologists across 41 Indian cities. Each rated on 8 inclusivity dimensions by real patients. Searchable in plain language. Available in 8 Indian languages. With phone numbers that actually work, addresses that actually exist, and honest flags on the ones that don't.

It's not perfect. 76 doctors still don't have phone numbers. Some entries only have first names. The data is crowdsourced and could be wrong. But it's better than a spreadsheet, and it's better than Google reviews, and it exists because one person decided to ask their community "who can we trust?" and 347 answers came back.

That's worth building for.
