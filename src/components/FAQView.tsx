'use client'

import { FAQEntry } from '@/lib/types'

interface FAQViewProps {
  faqEntries: FAQEntry[]
  selectedPerson: string
  search: string
  focusedId: string | null
  onFocus: (id: string) => void
}

export default function FAQView({
  faqEntries,
  selectedPerson,
  search,
  focusedId,
  onFocus,
}: FAQViewProps) {
  const query = search.toLowerCase().trim()

  const filteredFAQs = faqEntries.filter((faq) => {
    if (!query) return true
    const answer = faq.answers[selectedPerson] || ''
    return (
      faq.question.toLowerCase().includes(query) ||
      answer.toLowerCase().includes(query)
    )
  })

  return (
    <div className="faq-content">
      {filteredFAQs.map((faq) => {
        const answer = faq.answers[selectedPerson] || ''
        return (
          <div
            key={faq.id}
            id={faq.id}
            className={`faq-entry${focusedId === faq.id ? ' entry-focused' : ''}`}
            onClick={() => onFocus(faq.id)}
          >
            <h3 className="faq-question">{faq.question}</h3>
            <p
              key={selectedPerson}
              className={`faq-answer fade-in${!answer ? ' faq-empty' : ''}`}
            >
              {answer || 'No answer yet.'}
            </p>
          </div>
        )
      })}

      {filteredFAQs.length === 0 && query && (
        <p className="no-content">No questions matching &ldquo;{search}&rdquo;</p>
      )}
    </div>
  )
}
