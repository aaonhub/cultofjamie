'use client'

import { useState, useEffect } from 'react'
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
  const [expandedId, setExpandedId] = useState<string | null>(focusedId)
  const query = search.toLowerCase().trim()

  useEffect(() => {
    if (focusedId) setExpandedId(focusedId)
  }, [focusedId])

  const filteredFAQs = faqEntries.filter((faq) => {
    if (!query) return true
    const answer = faq.answers[selectedPerson] || ''
    return (
      faq.question.toLowerCase().includes(query) ||
      answer.toLowerCase().includes(query)
    )
  })

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
    onFocus(id)
  }

  return (
    <div className="faq-content">
      {filteredFAQs.map((faq) => {
        const answer = faq.answers[selectedPerson] || ''
        const isExpanded = expandedId === faq.id
        return (
          <div
            key={faq.id}
            id={faq.id}
            className={`faq-entry${isExpanded ? ' faq-expanded' : ''}${focusedId === faq.id ? ' entry-focused' : ''}`}
            onClick={() => toggleExpand(faq.id)}
          >
            <h3 className="faq-question">{faq.question}</h3>
            <div className="faq-answer-wrapper" aria-hidden={!isExpanded}>
              <p
                key={selectedPerson}
                className={`faq-answer fade-in${!answer ? ' faq-empty' : ''}`}
              >
                {answer || 'No answer yet.'}
              </p>
            </div>
          </div>
        )
      })}

      {filteredFAQs.length === 0 && query && (
        <p className="no-content">No questions matching &ldquo;{search}&rdquo;</p>
      )}
    </div>
  )
}
