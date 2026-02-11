'use client'

import { Term } from '@/lib/types'

interface DictionaryViewProps {
  terms: Term[]
  selectedPerson: string
  search: string
  onSearchChange: (value: string) => void
  focusedId: string | null
  onFocus: (id: string) => void
}

export default function DictionaryView({
  terms,
  selectedPerson,
  search,
  onSearchChange,
  focusedId,
  onFocus,
}: DictionaryViewProps) {
  const query = search.toLowerCase().trim()

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

  return (
    <>
      <label className="search-bar">
        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search terms..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </label>

      <section>
        {sortedTerms.map((term) => (
          <TermEntry
            key={term.id}
            id={term.id}
            name={term.name}
            definition={term.definitions[selectedPerson] || ''}
            selectedPerson={selectedPerson}
            focused={focusedId === term.id}
            onFocus={onFocus}
          />
        ))}
      </section>

      {sortedTerms.length === 0 && query && (
        <p className="no-content">No terms matching &ldquo;{search}&rdquo;</p>
      )}
    </>
  )
}

function TermEntry({
  id,
  name,
  definition,
  selectedPerson,
  focused,
  onFocus,
}: {
  id: string
  name: string
  definition: string
  selectedPerson: string
  focused: boolean
  onFocus: (id: string) => void
}) {
  return (
    <div
      className={`term-entry${focused ? ' entry-focused' : ''}`}
      id={id}
      onClick={() => onFocus(id)}
    >
      <span className="term-name">{name}</span>
      <span
        key={selectedPerson}
        className={`term-definition fade-in${!definition ? ' term-empty' : ''}`}
      >
        {definition || 'No definition yet.'}
      </span>
    </div>
  )
}
