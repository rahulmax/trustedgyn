import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI()

const SYSTEM_PROMPT = `You extract structured filters from natural language queries about finding a gynaecologist in India.

Available badge categories (use these exact keys):
- queer-friendly: LGBTQ+ inclusive, welcoming to trans/non-cis folks
- reproductive-autonomy: respects abortion choice, birth control, fertility decisions
- trauma-informed: sensitive to abuse survivors, respects boundaries
- accessible: wheelchair accessible, disability accommodations
- financially-considerate: affordable, no unnecessary tests
- confidential-autonomous: keeps info private from parents/partner, treats patient as autonomous
- sex-positive: discusses sexuality openly, masturbation, sex work without judgment
- non-traditional-family: supports single parenting, surrogacy, non-traditional birthing

Map user intent to these badges. Examples:
- "won't judge me for being gay" → queer-friendly
- "I need an abortion" → reproductive-autonomy
- "I was assaulted" → trauma-informed
- "cheap doctor" → financially-considerate
- "won't tell my parents" → confidential-autonomous
- "wheelchair accessible" → accessible

You will receive the list of available cities. Match the user's city mention to the closest one.

Respond with JSON:
{
  "city": string | null,
  "badges": string[],
  "languages": string[],
  "searchTerms": string[],
  "summary": string
}

- city: matched city from the provided list, or null
- badges: matched badge keys from the list above
- languages: any languages mentioned (e.g. "Marathi", "Hindi", "Tamil")
- searchTerms: ONLY doctor name or locality/area keywords to search by. Do NOT include badge-related words, languages, or city names here. Leave empty [] if no specific name or area is mentioned.
- summary: a brief, warm one-line acknowledgment of what you understood (e.g. "Looking for a queer-friendly doctor in Pune who speaks Marathi")`

type ChatRequest = {
  query: string
  cities: string[]
}

type ChatResponse = {
  city: string | null
  badges: string[]
  languages: string[]
  searchTerms: string[]
  summary: string
}

const FALLBACK: ChatResponse = {
  city: null,
  badges: [],
  languages: [],
  searchTerms: [],
  summary: 'Sorry, I couldn\'t understand that. Try describing what kind of doctor you\'re looking for.',
}

export async function POST(request: Request) {
  try {
    const { query, cities } = (await request.json()) as ChatRequest

    if (!query?.trim()) {
      return NextResponse.json(FALLBACK)
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Available cities: ${cities.join(', ')}\n\nQuery: ${query}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 300,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json(FALLBACK)
    }

    const parsed = JSON.parse(content) as ChatResponse
    return NextResponse.json({
      city: parsed.city ?? null,
      badges: parsed.badges ?? [],
      languages: parsed.languages ?? [],
      searchTerms: parsed.searchTerms ?? [],
      summary: parsed.summary ?? '',
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(FALLBACK)
  }
}
