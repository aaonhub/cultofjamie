export interface Term {
  id: string
  name: string
  definitions: Record<string, string>
}

export interface FAQEntry {
  id: string
  question: string
  answers: Record<string, string>
}

export interface SiteData {
  people: string[]
  terms: Term[]
  faq: FAQEntry[]
}

export type Dictionary = SiteData
