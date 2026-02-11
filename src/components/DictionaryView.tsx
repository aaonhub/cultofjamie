'use client'

import { useState } from 'react'
import { Dictionary, Term } from '@/lib/types'

type ViewMode = 'grouped' | 'alphabetical'

export default function DictionaryView({ dictionary }: { dictionary: Dictionary }) {
  const [view, setView] = useState<ViewMode>('grouped')

  const sortedTerms = [...dictionary.terms].sort((a, b) =>
    a.name.localeCompare(b.name)
  )

  const groupedByCategory = dictionary.categories.map((category) => ({
    category,
    terms: sortedTerms.filter((t) => t.category === category),
  }))

  return (
    <>
      <div className="view-toggle">
        <button
          className={view === 'grouped' ? 'active' : ''}
          onClick={() => setView('grouped')}
        >
          By Category
        </button>
        <button
          className={view === 'alphabetical' ? 'active' : ''}
          onClick={() => setView('alphabetical')}
        >
          Alphabetical
        </button>
      </div>

      {view === 'grouped' ? (
        groupedByCategory.map(({ category, terms }) => (
          <section key={category}>
            <h2>{category}</h2>
            {terms.map((term) => (
              <TermEntry key={term.id} term={term} />
            ))}
          </section>
        ))
      ) : (
        <section>
          {sortedTerms.map((term) => (
            <TermEntry key={term.id} term={term} />
          ))}
        </section>
      )}
    </>
  )
}

function TermEntry({ term }: { term: Term }) {
  return (
    <div className="term-entry">
      <span className="term-name">{term.name}</span>
      <span className="term-definition">{term.definition}</span>
    </div>
  )
}
