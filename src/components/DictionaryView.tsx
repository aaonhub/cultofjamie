'use client'

import { useState } from 'react'
import { Term } from '@/lib/types'

interface DictionaryViewProps {
  terms: Term[]
  categories: string[]
  selectedPerson: string
}

export default function DictionaryView({
  terms,
  categories,
  selectedPerson,
}: DictionaryViewProps) {
  const [search, setSearch] = useState('')

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

  const groupedByCategory = categories
    .map((category) => ({
      category,
      terms: sortedTerms.filter((t) => t.category === category),
    }))
    .filter((group) => group.terms.length > 0)

  return (
    <>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search terms..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {groupedByCategory.map(({ category, terms: catTerms }) => (
        <section key={category}>
          <h2>{category}</h2>
          {catTerms.map((term) => (
            <TermEntry
              key={term.id}
              name={term.name}
              definition={term.definitions[selectedPerson] || ''}
            />
          ))}
        </section>
      ))}

      {sortedTerms.length === 0 && query && (
        <p className="no-content">No terms matching &ldquo;{search}&rdquo;</p>
      )}
    </>
  )
}

function TermEntry({ name, definition }: { name: string; definition: string }) {
  return (
    <div className="term-entry">
      <span className="term-name">{name}</span>
      <span className={`term-definition${!definition ? ' term-empty' : ''}`}>
        {definition || 'No definition yet.'}
      </span>
    </div>
  )
}
