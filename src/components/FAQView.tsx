'use client'

import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react'
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
  const answerRefs = useRef<Map<string, HTMLParagraphElement>>(new Map())
  const entryRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const scrollAnchorRef = useRef<{ id: string; top: number } | null>(null)

  useEffect(() => {
    if (focusedId) setExpandedId(focusedId)
  }, [focusedId])

  const setAnswerRef = useCallback((id: string, el: HTMLParagraphElement | null) => {
    if (el) answerRefs.current.set(id, el)
    else answerRefs.current.delete(id)
  }, [])

  const setEntryRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) entryRefs.current.set(id, el)
    else entryRefs.current.delete(id)
  }, [])

  // After state change, correct scroll so the clicked entry's header stays put
  useLayoutEffect(() => {
    const anchor = scrollAnchorRef.current
    if (!anchor) return
    const el = entryRefs.current.get(anchor.id)
    if (el) {
      const currentTop = el.getBoundingClientRect().top
      const drift = currentTop - anchor.top
      if (Math.abs(drift) > 1) {
        window.scrollBy({ top: drift, behavior: 'instant' as ScrollBehavior })
      }
    }
    scrollAnchorRef.current = null
  }, [expandedId])

  // Measure and set max-height for smooth expand/collapse
  useEffect(() => {
    answerRefs.current.forEach((el, id) => {
      if (id === expandedId) {
        el.style.maxHeight = el.scrollHeight + 'px'
      } else {
        // Collapse: set explicit current height first, then shrink on next frame
        el.style.maxHeight = el.scrollHeight + 'px'
        requestAnimationFrame(() => {
          el.style.maxHeight = ''
        })
      }
    })
  }, [expandedId, selectedPerson])

  // Update max-height when expanded content might change (e.g. person switch)
  useEffect(() => {
    if (expandedId) {
      const el = answerRefs.current.get(expandedId)
      if (el) {
        el.style.maxHeight = el.scrollHeight + 'px'
      }
    }
  }, [expandedId, selectedPerson])

  const filteredFAQs = faqEntries.filter((faq) => {
    if (!query) return true
    const answer = faq.answers[selectedPerson] || ''
    return (
      faq.question.toLowerCase().includes(query) ||
      answer.toLowerCase().includes(query)
    )
  })

  function toggleExpand(id: string) {
    // Snapshot the clicked entry's position before React re-renders
    const el = entryRefs.current.get(id)
    if (el) {
      scrollAnchorRef.current = { id, top: el.getBoundingClientRect().top }
    }
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
            ref={(el) => setEntryRef(faq.id, el)}
            className={`faq-entry${isExpanded ? ' faq-expanded' : ''}${focusedId === faq.id ? ' entry-focused' : ''}`}
            onClick={() => toggleExpand(faq.id)}
          >
            <h3 className="faq-question">{faq.question}</h3>
            <p
              ref={(el) => setAnswerRef(faq.id, el)}
              key={selectedPerson}
              className={`faq-answer fade-in${isExpanded ? ' faq-answer-expanded' : ''}${!answer ? ' faq-empty' : ''}`}
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
