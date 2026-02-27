'use client'

import { useState, useEffect } from 'react'
import { Term } from '@/lib/types'

interface DictionaryViewProps {
  terms: Term[]
  selectedPerson: string
  search: string
  focusedId: string | null
  onFocus: (id: string) => void
}

export default function DictionaryView({
  terms,
  selectedPerson,
  search,
  focusedId,
  onFocus,
}: DictionaryViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(focusedId)
  const query = search.toLowerCase().trim()

  useEffect(() => {
    if (focusedId) setExpandedId(focusedId)
  }, [focusedId])

  const filteredTerms = terms.filter((t) => {
    if (!query) return true
    const def = t.definitions[selectedPerson] || ''
    return (
      t.name.toLowerCase().includes(query) ||
      def.toLowerCase().includes(query)
    )
  })

  const sortedTerms = [...filteredTerms].sort((a, b) =>
    a.name.localeCompare(b.name)
  )

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
    onFocus(id)
  }

  return (
    <>
      <section>
        {sortedTerms.map((term) => {
          const definition = term.definitions[selectedPerson] || ''
          const isExpanded = expandedId === term.id
          const firstLine = definition.split('\n')[0] || ''
          const hasMore = definition.includes('\n') && definition.split('\n').length > 1

          return (
            <div
              key={term.id}
              id={term.id}
              className={`term-entry${isExpanded ? ' term-expanded' : ''}${focusedId === term.id ? ' entry-focused' : ''}`}
              onClick={() => toggleExpand(term.id)}
            >
              <span className="term-name">{term.name}</span>
              <span
                key={selectedPerson}
                className={`term-preview fade-in${!definition ? ' term-empty' : ''}`}
              >
                {firstLine || 'No definition yet.'}
              </span>
              {hasMore && (
                <div className="term-detail-wrapper" aria-hidden={!isExpanded}>
                  <span className="term-definition fade-in">
                    {definition.split('\n').slice(1).join('\n')}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </section>

      {sortedTerms.length === 0 && query && (
        <p className="no-content">No terms matching &ldquo;{search}&rdquo;</p>
      )}
    </>
  )
}
