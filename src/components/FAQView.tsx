'use client'

import { useState } from 'react'
import { FAQEntry } from '@/lib/types'

interface FAQViewProps {
  faqEntries: FAQEntry[]
  selectedPerson: string
}

export default function FAQView({ faqEntries, selectedPerson }: FAQViewProps) {
  const [search, setSearch] = useState('')

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
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search questions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filteredFAQs.map((faq) => {
        const answer = faq.answers[selectedPerson] || ''
        return (
          <div key={faq.id} className="faq-entry">
            <h3 className="faq-question">{faq.question}</h3>
            <p className={`faq-answer${!answer ? ' faq-empty' : ''}`}>
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
