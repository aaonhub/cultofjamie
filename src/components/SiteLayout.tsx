'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { SiteData } from '@/lib/types'
import PersonSidebar from './PersonSidebar'
import DictionaryView from './DictionaryView'
import FAQView from './FAQView'

type ActiveTab = 'dictionary' | 'faq'

export default function SiteLayout({ data }: { data: SiteData }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const paramPerson = searchParams.get('person')
  const paramTab = searchParams.get('tab')
  const paramSearch = searchParams.get('q')

  const initialPerson =
    paramPerson && data.people.includes(paramPerson)
      ? paramPerson
      : data.people[0] || 'Jamie'
  const initialTab: ActiveTab =
    paramTab === 'faq' ? 'faq' : 'dictionary'
  const initialSearch = paramSearch || ''

  const [selectedPerson, setSelectedPerson] = useState(initialPerson)
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab)
  const [search, setSearch] = useState(initialSearch)

  const updateURL = useCallback(
    (person: string, tab: ActiveTab, q: string) => {
      const params = new URLSearchParams()
      if (person !== data.people[0]) params.set('person', person)
      if (tab !== 'dictionary') params.set('tab', tab)
      if (q) params.set('q', q)
      const hash = window.location.hash
      const qs = params.toString()
      const url = qs ? `?${qs}${hash}` : `/${hash}`
      router.replace(url, { scroll: false })
    },
    [data.people, router]
  )

  // Sync state changes to URL
  useEffect(() => {
    updateURL(selectedPerson, activeTab, search)
  }, [selectedPerson, activeTab, search, updateURL])

  // Scroll to hash target on initial load
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash) {
      // Small delay to let the page render first
      setTimeout(() => {
        const el = document.getElementById(hash)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [])

  function handleSelectPerson(person: string) {
    setSelectedPerson(person)
  }

  function handleSelectTab(tab: ActiveTab) {
    setActiveTab(tab)
    setSearch('')
  }

  return (
    <div className="site-layout">
      <PersonSidebar
        people={data.people}
        selectedPerson={selectedPerson}
        onSelectPerson={handleSelectPerson}
      />

      <div className="content-area">
        <div className="tab-toggle">
          <button
            className={activeTab === 'dictionary' ? 'active' : ''}
            onClick={() => handleSelectTab('dictionary')}
          >
            Dictionary
          </button>
          <button
            className={activeTab === 'faq' ? 'active' : ''}
            onClick={() => handleSelectTab('faq')}
          >
            FAQ
          </button>
        </div>

        {activeTab === 'dictionary' ? (
          <DictionaryView
            terms={data.terms}
            categories={data.categories}
            selectedPerson={selectedPerson}
            search={search}
            onSearchChange={setSearch}
          />
        ) : (
          <FAQView
            faqEntries={data.faq}
            selectedPerson={selectedPerson}
            search={search}
            onSearchChange={setSearch}
          />
        )}
      </div>
    </div>
  )
}
