'use client'

import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react'
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
  const paramFocus = searchParams.get('focus')

  const initialPerson =
    paramPerson && data.people.includes(paramPerson)
      ? paramPerson
      : data.people[0] || 'Jamie'
  const initialTab: ActiveTab =
    paramTab === 'dictionary' ? 'dictionary' : 'faq'
  const initialSearch = paramSearch || ''
  const initialFocus = paramFocus || null

  const [selectedPerson, setSelectedPerson] = useState(initialPerson)
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab)
  const [search, setSearch] = useState(initialSearch)
  const [focusedId, setFocusedId] = useState<string | null>(initialFocus)

  // Track the viewport offset of the focused element before a person switch
  const savedOffsetRef = useRef<number | null>(null)
  const urlTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced URL updates to prevent router.replace spam (causes crashes on mobile)
  useEffect(() => {
    if (urlTimerRef.current) clearTimeout(urlTimerRef.current)
    urlTimerRef.current = setTimeout(() => {
      try {
        const params = new URLSearchParams()
        if (selectedPerson !== data.people[0]) params.set('person', selectedPerson)
        if (activeTab !== 'faq') params.set('tab', activeTab)
        if (search) params.set('q', search)
        if (focusedId) params.set('focus', focusedId)
        const qs = params.toString()
        const url = qs ? `?${qs}` : '/'
        router.replace(url, { scroll: false })
      } catch {
        // Silently ignore router errors
      }
    }, 300)
    return () => {
      if (urlTimerRef.current) clearTimeout(urlTimerRef.current)
    }
  }, [selectedPerson, activeTab, search, focusedId, data.people, router])

  // Scroll to focused element on initial page load only
  useEffect(() => {
    if (initialFocus) {
      try {
        const el = document.getElementById(initialFocus)
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' })
      } catch {
        // Some mobile browsers don't support instant behavior
        const el = document.getElementById(initialFocus)
        if (el) el.scrollIntoView({ block: 'center' })
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Easter egg: update header to show selected person's name
  useEffect(() => {
    const title = document.getElementById('site-title')
    if (title) title.textContent = `Cult of ${selectedPerson}`
  }, [selectedPerson])

  function handleSelectPerson(person: string) {
    // Before switching, save where the focused element is on screen
    if (focusedId) {
      const el = document.getElementById(focusedId)
      if (el) {
        savedOffsetRef.current = el.getBoundingClientRect().top
      }
    }
    setSelectedPerson(person)
  }

  // After render from person switch, restore the focused element to the same viewport position
  useLayoutEffect(() => {
    if (focusedId && savedOffsetRef.current !== null) {
      try {
        const el = document.getElementById(focusedId)
        if (el) {
          const currentTop = el.getBoundingClientRect().top
          const drift = currentTop - savedOffsetRef.current
          window.scrollBy({ top: drift, behavior: 'instant' })
        }
      } catch {
        // Fallback for browsers that don't support instant behavior
      }
      savedOffsetRef.current = null
    }
  }, [selectedPerson, focusedId])

  function handleSelectTab(tab: ActiveTab) {
    setActiveTab(tab)
    setSearch('')
    setFocusedId(null)
  }

  function handleFocus(id: string) {
    setFocusedId(focusedId === id ? null : id)
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
            className={activeTab === 'faq' ? 'active' : ''}
            onClick={() => handleSelectTab('faq')}
          >
            FAQ
          </button>
          <button
            className={activeTab === 'dictionary' ? 'active' : ''}
            onClick={() => handleSelectTab('dictionary')}
          >
            Dictionary
          </button>
        </div>

        <label className="search-bar">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>

        {activeTab === 'dictionary' ? (
          <DictionaryView
            terms={data.terms}
            selectedPerson={selectedPerson}
            search={search}
            focusedId={focusedId}
            onFocus={handleFocus}
          />
        ) : (
          <FAQView
            faqEntries={data.faq}
            selectedPerson={selectedPerson}
            search={search}
            focusedId={focusedId}
            onFocus={handleFocus}
          />
        )}
      </div>
    </div>
  )
}
