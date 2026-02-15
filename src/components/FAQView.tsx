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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const query = search.toLowerCase().trim()

  // Auto-expand the focused entry from URL
  useEffect(() => {
    if (focusedId && !expandedIds.has(focusedId)) {
      setExpandedIds((prev) => new Set(prev).add(focusedId))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
    onFocus(id)
  }

  // When searching, auto-expand all matching entries
  const isSearching = query.length > 0

  return (
    <div className="faq-content">
      {filteredFAQs.map((faq) => {
        const answer = faq.answers[selectedPerson] || ''
        const isExpanded = isSearching || expandedIds.has(faq.id)
        return (
          <div
            key={faq.id}
            id={faq.id}
            className={`faq-entry${focusedId === faq.id ? ' entry-focused' : ''}`}
            onClick={() => toggleExpand(faq.id)}
          >
            <h3 className="faq-question">
              <span
                className={`faq-chevron${isExpanded ? ' expanded' : ''}`}
              >
                ›
              </span>
              {faq.question}
            </h3>
            {isExpanded && (
              <p
                key={selectedPerson}
                className={`faq-answer fade-in${!answer ? ' faq-empty' : ''}`}
              >
                {answer || 'No answer yet.'}
              </p>
            )}
          </div>
        )
      })}

      {filteredFAQs.length === 0 && query && (
        <p className="no-content">No questions matching &ldquo;{search}&rdquo;</p>
      )}
    </div>
  )
}
