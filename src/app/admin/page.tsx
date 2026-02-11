'use client'

import { useState, useRef, useCallback } from 'react'
import { SiteData, Term, FAQEntry } from '@/lib/types'
import styles from './admin.module.css'

type AdminTab = 'faq' | 'terms' | 'people'

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [data, setData] = useState<SiteData | null>(null)
  const [originalData, setOriginalData] = useState<SiteData | null>(null)
  const [sha, setSha] = useState('')
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<AdminTab>('faq')
  const [selectedPerson, setSelectedPerson] = useState('')
  const [authenticatedPerson, setAuthenticatedPerson] = useState('')
  const [role, setRole] = useState<'master' | 'person'>('person')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [adminSearch, setAdminSearch] = useState('')
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  const isMaster = role === 'master'

  // --- Auto-resize textarea ---
  const autoResize = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [])

  const textareaRef = useCallback((el: HTMLTextAreaElement | null) => {
    if (el) {
      autoResize(el)
    }
  }, [autoResize])

  function handleTextareaChange(
    e: React.ChangeEvent<HTMLTextAreaElement>,
    updater: (value: string) => void
  ) {
    updater(e.target.value)
    autoResize(e.target)
  }

  // --- Dirty checking ---
  function isTermDirty(termId: string): boolean {
    if (!data || !originalData) return false
    const current = data.terms.find(t => t.id === termId)
    const original = originalData.terms.find(t => t.id === termId)
    if (!original) return true // new term
    if (!current) return false
    if (current.name !== original.name) return true
    const allPeople = new Set([...Object.keys(current.definitions), ...Object.keys(original.definitions)])
    for (const p of allPeople) {
      if ((current.definitions[p] || '') !== (original.definitions[p] || '')) return true
    }
    return false
  }

  function isFAQDirty(faqId: string): boolean {
    if (!data || !originalData) return false
    const current = data.faq.find(f => f.id === faqId)
    const original = originalData.faq.find(f => f.id === faqId)
    if (!original) return true // new FAQ
    if (!current) return false
    if (current.question !== original.question) return true
    const allPeople = new Set([...Object.keys(current.answers), ...Object.keys(original.answers)])
    for (const p of allPeople) {
      if ((current.answers[p] || '') !== (original.answers[p] || '')) return true
    }
    return false
  }

  function isPeopleDirty(): boolean {
    if (!data || !originalData) return false
    if (data.people.length !== originalData.people.length) return true
    return data.people.some((p, i) => p !== originalData.people[i])
  }

  function hasAnyChanges(): boolean {
    if (!data || !originalData) return false
    if (isPeopleDirty()) return true
    if (data.terms.length !== originalData.terms.length) return true
    if (data.faq.length !== originalData.faq.length) return true
    // Check order changes
    if (data.terms.some((t, i) => t.id !== originalData.terms[i]?.id)) return true
    if (data.faq.some((f, i) => f.id !== originalData.faq[i]?.id)) return true
    for (const t of data.terms) {
      if (isTermDirty(t.id)) return true
    }
    for (const f of data.faq) {
      if (isFAQDirty(f.id)) return true
    }
    return false
  }

  // --- Auth ---
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      const result = await res.json()
      setAuthenticated(true)
      setAuthenticatedPerson(result.person)
      setRole(result.role)
      if (result.role !== 'master') {
        setSelectedPerson(result.person)
      }
      setPassword('')
      loadData()
    } else {
      setError('Invalid password')
    }
  }

  function handleLogout() {
    setAuthenticated(false)
    setData(null)
    setOriginalData(null)
    setSha('')
    setAuthenticatedPerson('')
    setRole('person')
    setSelectedPerson('')
    setExpandedId(null)
    setAdminSearch('')
    setSavingIds(new Set())
    setSavedIds(new Set())
    document.cookie = 'admin-session=; path=/; max-age=0'
  }

  async function loadData() {
    const res = await fetch('/api/save')
    if (res.ok) {
      const result = await res.json()
      const siteData = result.dictionary as SiteData
      setData(siteData)
      setOriginalData(JSON.parse(JSON.stringify(siteData)))
      setSha(result.sha)
      if (result.person) {
        setAuthenticatedPerson(result.person)
        setRole(result.role || 'person')
      }
      if (!selectedPerson && siteData.people.length > 0) {
        if (result.role === 'master') {
          setSelectedPerson(siteData.people[0])
        } else {
          setSelectedPerson(result.person)
        }
      }
    } else if (res.status === 401) {
      setAuthenticated(false)
    } else {
      setError('Failed to load data')
    }
  }

  async function saveData(triggerId: string) {
    if (!data) return
    setSavingIds(prev => new Set(prev).add(triggerId))
    setSavedIds(prev => { const s = new Set(prev); s.delete(triggerId); return s })
    setError('')
    const res = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dictionary: data, sha }),
    })
    setSavingIds(prev => { const s = new Set(prev); s.delete(triggerId); return s })
    if (res.ok) {
      setSavedIds(prev => new Set(prev).add(triggerId))
      // Refresh sha and original data
      const getRes = await fetch('/api/save')
      if (getRes.ok) {
        const result = await getRes.json()
        setOriginalData(JSON.parse(JSON.stringify(result.dictionary)))
        setSha(result.sha)
      }
      // Clear "Saved" after 2s
      setTimeout(() => {
        setSavedIds(prev => { const s = new Set(prev); s.delete(triggerId); return s })
      }, 2000)
    } else {
      const result = await res.json()
      setError(result.error || 'Failed to save')
    }
  }

  function generateId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  // --- Reorder helpers (master only) — auto-save ---
  function moveItem<T>(arr: T[], from: number, to: number): T[] {
    if (to < 0 || to >= arr.length) return arr
    const updated = [...arr]
    const [item] = updated.splice(from, 1)
    updated.splice(to, 0, item)
    return updated
  }

  function moveTermUp(index: number) {
    if (!data || !isMaster || index === 0) return
    setData({ ...data, terms: moveItem(data.terms, index, index - 1) })
  }
  function moveTermDown(index: number) {
    if (!data || !isMaster || index >= data.terms.length - 1) return
    setData({ ...data, terms: moveItem(data.terms, index, index + 1) })
  }
  function moveFAQUp(index: number) {
    if (!data || !isMaster || index === 0) return
    setData({ ...data, faq: moveItem(data.faq, index, index - 1) })
  }
  function moveFAQDown(index: number) {
    if (!data || !isMaster || index >= data.faq.length - 1) return
    setData({ ...data, faq: moveItem(data.faq, index, index + 1) })
  }
  function movePersonUp(index: number) {
    if (!data || !isMaster || index === 0) return
    setData({ ...data, people: moveItem(data.people, index, index - 1) })
  }
  function movePersonDown(index: number) {
    if (!data || !isMaster || index >= data.people.length - 1) return
    setData({ ...data, people: moveItem(data.people, index, index + 1) })
  }

  // --- People (master only) ---
  function addPerson(name: string) {
    if (!data || !name.trim() || !isMaster) return
    if (data.people.includes(name.trim())) return
    setData({ ...data, people: [...data.people, name.trim()] })
  }

  function removePerson(name: string) {
    if (!data || !isMaster) return
    if (!confirm(`Remove "${name}"? Their definitions and FAQ answers will be deleted.`)) return
    const updated: SiteData = {
      ...data,
      people: data.people.filter((p) => p !== name),
      terms: data.terms.map((t) => {
        const defs = { ...t.definitions }
        delete defs[name]
        return { ...t, definitions: defs }
      }),
      faq: data.faq.map((f) => {
        const ans = { ...f.answers }
        delete ans[name]
        return { ...f, answers: ans }
      }),
    }
    setData(updated)
    if (selectedPerson === name) {
      setSelectedPerson(updated.people[0] || '')
    }
  }

  // --- Terms ---
  function addTerm() {
    if (!data || !isMaster) return
    const id = `new-term-${Date.now()}`
    const newTerm: Term = { id, name: '', definitions: {} }
    setData({ ...data, terms: [...data.terms, newTerm] })
    setExpandedId(id)
  }

  function updateTermName(index: number, value: string) {
    if (!data || !isMaster) return
    const updated = [...data.terms]
    const newId = generateId(value) || updated[index].id
    updated[index] = { ...updated[index], name: value, id: newId }
    setData({ ...data, terms: updated })
    setExpandedId(newId)
  }

  function updateTermDefinition(index: number, person: string, value: string) {
    if (!data) return
    if (!isMaster && person !== authenticatedPerson) return
    const updated = [...data.terms]
    updated[index] = {
      ...updated[index],
      definitions: { ...updated[index].definitions, [person]: value },
    }
    setData({ ...data, terms: updated })
  }

  function deleteTerm(index: number) {
    if (!data || !isMaster) return
    if (!confirm(`Delete "${data.terms[index].name || 'this term'}"?`)) return
    const updated = { ...data, terms: data.terms.filter((_, i) => i !== index) }
    setData(updated)
    setExpandedId(null)
  }

  // --- FAQ ---
  function addFAQ() {
    if (!data || !isMaster) return
    const id = `faq-${Date.now()}`
    const newFAQ: FAQEntry = { id, question: '', answers: {} }
    setData({ ...data, faq: [...data.faq, newFAQ] })
    setExpandedId(id)
  }

  function updateFAQQuestion(index: number, question: string) {
    if (!data || !isMaster) return
    const updated = [...data.faq]
    const newId = generateId(question) || updated[index].id
    updated[index] = { ...updated[index], question, id: newId }
    setData({ ...data, faq: updated })
    setExpandedId(newId)
  }

  function updateFAQAnswer(index: number, person: string, value: string) {
    if (!data) return
    if (!isMaster && person !== authenticatedPerson) return
    const updated = [...data.faq]
    updated[index] = {
      ...updated[index],
      answers: { ...updated[index].answers, [person]: value },
    }
    setData({ ...data, faq: updated })
  }

  function deleteFAQ(index: number) {
    if (!data || !isMaster) return
    if (!confirm(`Delete "${data.faq[index].question || 'this question'}"?`)) return
    const updated = { ...data, faq: data.faq.filter((_, i) => i !== index) }
    setData(updated)
    setExpandedId(null)
  }

  // --- Save button helper ---
  function renderSaveBtn(id: string, isDirty: boolean) {
    const isSaving = savingIds.has(id)
    const isSaved = savedIds.has(id)
    if (isSaving) {
      return <button className={styles.cardSaveBtn} disabled>Saving...</button>
    }
    if (isSaved) {
      return <button className={`${styles.cardSaveBtn} ${styles.cardSaveBtnSaved}`} disabled>Saved</button>
    }
    if (isDirty) {
      return (
        <button
          className={`${styles.cardSaveBtn} ${styles.cardSaveBtnDirty}`}
          onClick={(e) => { e.stopPropagation(); saveData(id) }}
        >
          Save
        </button>
      )
    }
    return null
  }

  // --- Login Screen ---
  if (!authenticated) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loginCard}>
          <h1>Cult of Jamie</h1>
          <p className={styles.loginSubtitle}>Admin</p>
          <form onSubmit={handleLogin} className={styles.loginForm}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
            />
            <button type="submit">Login</button>
          </form>
          {error && <p className={styles.error}>{error}</p>}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loginCard}>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  const canEditDefinition = isMaster || selectedPerson === authenticatedPerson
  const readOnlyStyle = !canEditDefinition
    ? { opacity: 0.5, cursor: 'not-allowed' as const }
    : {}

  const tabs: AdminTab[] = isMaster ? ['faq', 'terms', 'people'] : ['faq', 'terms']
  const query = adminSearch.toLowerCase().trim()

  const filteredTerms = data.terms.map((t, i) => ({ term: t, index: i })).filter(({ term }) => {
    if (!query) return true
    const def = term.definitions[selectedPerson] || ''
    return term.name.toLowerCase().includes(query) || def.toLowerCase().includes(query)
  })

  const filteredFAQs = data.faq.map((f, i) => ({ faq: f, index: i })).filter(({ faq }) => {
    if (!query) return true
    const ans = faq.answers[selectedPerson] || ''
    return faq.question.toLowerCase().includes(query) || ans.toLowerCase().includes(query)
  })

  const tabCounts: Record<AdminTab, number> = {
    terms: data.terms.length,
    faq: data.faq.length,
    people: data.people.length,
  }

  const peopleDirty = isPeopleDirty()
  const anyOrderDirty = (() => {
    if (!originalData) return false
    if (data.terms.length !== originalData.terms.length) return true
    if (data.faq.length !== originalData.faq.length) return true
    if (data.terms.some((t, i) => t.id !== originalData.terms[i]?.id)) return true
    if (data.faq.some((f, i) => f.id !== originalData.faq[i]?.id)) return true
    return false
  })()

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Site Editor</h1>
          <p className={styles.loggedInAs}>
            {isMaster ? (
              <>Logged in as <strong>Master</strong></>
            ) : (
              <>Logged in as <strong>{authenticatedPerson}</strong></>
            )}
            {' · '}
            <button className={styles.logoutBtn} onClick={handleLogout}>
              Logout
            </button>
          </p>
        </div>
        {/* Show a global save for structural changes (reorder, add, delete) */}
        {anyOrderDirty && renderSaveBtn('_structure', true)}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.adminTabs}>
        <div className={styles.tabButtons}>
          {tabs.map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? styles.tabActive : styles.tab}
              onClick={() => { setActiveTab(tab); setAdminSearch(''); setExpandedId(null) }}
            >
              {tab === 'faq' ? 'FAQ' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span className={styles.tabCount}>{tabCounts[tab]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Person selector + search for Terms and FAQ tabs */}
      {(activeTab === 'terms' || activeTab === 'faq') && (
        <div className={styles.controlBar}>
          <div className={styles.personSelect}>
            {isMaster ? (
              <label>
                Editing as:
                <select
                  value={selectedPerson}
                  onChange={(e) => setSelectedPerson(e.target.value)}
                >
                  {data.people.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>
            ) : (
              <label>
                Viewing:
                <select
                  value={selectedPerson}
                  onChange={(e) => setSelectedPerson(e.target.value)}
                >
                  {data.people.map((p) => (
                    <option key={p} value={p}>
                      {p}{p === authenticatedPerson ? ' (you)' : ''}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {!isMaster && !canEditDefinition && (
              <span className={styles.readOnlyBadge}>Read-only</span>
            )}
          </div>
          <input
            className={styles.adminSearch}
            type="text"
            placeholder={activeTab === 'terms' ? 'Filter terms...' : 'Filter questions...'}
            value={adminSearch}
            onChange={(e) => setAdminSearch(e.target.value)}
          />
        </div>
      )}

      {/* FAQ Tab */}
      {activeTab === 'faq' && (
        <div>
          {isMaster && (
            <div className={styles.toolbar}>
              <button onClick={addFAQ}>+ Add Question</button>
            </div>
          )}
          {filteredFAQs.map(({ faq, index }) => {
            const isExpanded = expandedId === faq.id
            const answer = faq.answers[selectedPerson]
            const hasAnswer = answer && answer.trim().length > 0
            const dirty = isFAQDirty(faq.id)
            return (
              <div
                key={faq.id || index}
                className={`${styles.card} ${isExpanded ? styles.cardExpanded : ''} ${dirty ? styles.cardDirty : ''}`}
              >
                <div
                  className={styles.cardHeader}
                  onClick={() => setExpandedId(isExpanded ? null : faq.id)}
                >
                  <div className={styles.cardTitleWrap}>
                    <span className={styles.cardTitle}>
                      {faq.question || <em className={styles.untitled}>Untitled question</em>}
                    </span>
                    {!isExpanded && (
                      <span className={hasAnswer ? styles.hasAnswer : styles.noAnswer}>
                        {hasAnswer ? `${selectedPerson} answered` : `No answer from ${selectedPerson}`}
                      </span>
                    )}
                  </div>
                  <div className={styles.cardActions}>
                    {renderSaveBtn(faq.id, dirty)}
                    {isMaster && (
                      <span className={styles.reorderBtns}>
                        <button
                          onClick={(e) => { e.stopPropagation(); moveFAQUp(index) }}
                          disabled={index === 0}
                          title="Move up"
                        >&#9650;</button>
                        <button
                          onClick={(e) => { e.stopPropagation(); moveFAQDown(index) }}
                          disabled={index === data.faq.length - 1}
                          title="Move down"
                        >&#9660;</button>
                      </span>
                    )}
                    <span className={styles.chevron}>{isExpanded ? '\u2212' : '+'}</span>
                  </div>
                </div>
                {isExpanded && (
                  <div className={styles.cardBody}>
                    {isMaster && (
                      <label>
                        <span className={styles.fieldLabel}>Question text</span>
                        <textarea
                          ref={textareaRef}
                          value={faq.question}
                          onChange={(e) =>
                            handleTextareaChange(e, (v) => updateFAQQuestion(index, v))
                          }
                          rows={1}
                          autoFocus
                        />
                      </label>
                    )}
                    <label>
                      <span className={styles.fieldLabel}>
                        {selectedPerson}&apos;s answer
                      </span>
                      <textarea
                        ref={textareaRef}
                        value={faq.answers[selectedPerson] || ''}
                        onChange={(e) =>
                          handleTextareaChange(e, (v) =>
                            updateFAQAnswer(index, selectedPerson, v)
                          )
                        }
                        rows={1}
                        placeholder={
                          canEditDefinition
                            ? `Write ${selectedPerson}'s answer...`
                            : `${selectedPerson} hasn't answered yet`
                        }
                        readOnly={!canEditDefinition}
                        style={readOnlyStyle}
                      />
                    </label>
                    {isMaster && (
                      <button
                        className={styles.deleteBtnInline}
                        onClick={() => deleteFAQ(index)}
                      >
                        Delete question
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
          {filteredFAQs.length === 0 && query && (
            <p className={styles.emptyState}>No questions matching &ldquo;{adminSearch}&rdquo;</p>
          )}
          {data.faq.length === 0 && !query && (
            <p className={styles.emptyState}>No FAQ questions yet.</p>
          )}
        </div>
      )}

      {/* Terms Tab */}
      {activeTab === 'terms' && (
        <div>
          {isMaster && (
            <div className={styles.toolbar}>
              <button onClick={addTerm}>+ Add Term</button>
            </div>
          )}
          {filteredTerms.map(({ term, index }) => {
            const isExpanded = expandedId === term.id
            const definition = term.definitions[selectedPerson]
            const hasDef = definition && definition.trim().length > 0
            const dirty = isTermDirty(term.id)
            return (
              <div
                key={term.id || index}
                className={`${styles.card} ${isExpanded ? styles.cardExpanded : ''} ${dirty ? styles.cardDirty : ''}`}
              >
                <div
                  className={styles.cardHeader}
                  onClick={() => setExpandedId(isExpanded ? null : term.id)}
                >
                  <div className={styles.cardTitleWrap}>
                    <span className={styles.cardTitle}>
                      {term.name || <em className={styles.untitled}>Untitled term</em>}
                    </span>
                    {!isExpanded && (
                      <span className={hasDef ? styles.hasAnswer : styles.noAnswer}>
                        {hasDef ? `${selectedPerson} defined` : `No definition from ${selectedPerson}`}
                      </span>
                    )}
                  </div>
                  <div className={styles.cardActions}>
                    {renderSaveBtn(term.id, dirty)}
                    {isMaster && (
                      <span className={styles.reorderBtns}>
                        <button
                          onClick={(e) => { e.stopPropagation(); moveTermUp(index) }}
                          disabled={index === 0}
                          title="Move up"
                        >&#9650;</button>
                        <button
                          onClick={(e) => { e.stopPropagation(); moveTermDown(index) }}
                          disabled={index === data.terms.length - 1}
                          title="Move down"
                        >&#9660;</button>
                      </span>
                    )}
                    <span className={styles.chevron}>{isExpanded ? '\u2212' : '+'}</span>
                  </div>
                </div>
                {isExpanded && (
                  <div className={styles.cardBody}>
                    {isMaster && (
                      <label>
                        <span className={styles.fieldLabel}>Term name</span>
                        <input
                          type="text"
                          value={term.name}
                          onChange={(e) => updateTermName(index, e.target.value)}
                          autoFocus
                        />
                      </label>
                    )}
                    <label>
                      <span className={styles.fieldLabel}>
                        {selectedPerson}&apos;s definition
                      </span>
                      <textarea
                        ref={textareaRef}
                        value={term.definitions[selectedPerson] || ''}
                        onChange={(e) =>
                          handleTextareaChange(e, (v) =>
                            updateTermDefinition(index, selectedPerson, v)
                          )
                        }
                        rows={1}
                        placeholder={
                          canEditDefinition
                            ? `Write ${selectedPerson}'s definition...`
                            : `${selectedPerson} hasn't written a definition yet`
                        }
                        readOnly={!canEditDefinition}
                        style={readOnlyStyle}
                      />
                    </label>
                    {isMaster && (
                      <button
                        className={styles.deleteBtnInline}
                        onClick={() => deleteTerm(index)}
                      >
                        Delete term
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
          {filteredTerms.length === 0 && query && (
            <p className={styles.emptyState}>No terms matching &ldquo;{adminSearch}&rdquo;</p>
          )}
          {data.terms.length === 0 && !query && (
            <p className={styles.emptyState}>No terms yet.</p>
          )}
        </div>
      )}

      {/* People Tab (master only) */}
      {activeTab === 'people' && isMaster && (
        <div>
          <div className={styles.peopleList}>
            {data.people.map((person, index) => (
              <div key={person} className={styles.personRow}>
                <span>{person}</span>
                <div className={styles.personRowActions}>
                  <span className={styles.reorderBtns}>
                    <button
                      onClick={() => movePersonUp(index)}
                      disabled={index === 0}
                      title="Move up"
                    >&#9650;</button>
                    <button
                      onClick={() => movePersonDown(index)}
                      disabled={index === data.people.length - 1}
                      title="Move down"
                    >&#9660;</button>
                  </span>
                  <button
                    className={styles.deleteBtnSmall}
                    onClick={() => removePerson(person)}
                    title={`Remove ${person}`}
                  >
                    &times;
                  </button>
                </div>
              </div>
            ))}
          </div>
          <form
            className={styles.addForm}
            onSubmit={(e) => {
              e.preventDefault()
              const input = (e.target as HTMLFormElement).elements.namedItem(
                'newPerson'
              ) as HTMLInputElement
              addPerson(input.value)
              input.value = ''
            }}
          >
            <input name="newPerson" type="text" placeholder="New person name" />
            <button type="submit">Add</button>
          </form>
          {peopleDirty && (
            <div className={styles.toolbar} style={{ marginTop: '1rem' }}>
              {renderSaveBtn('_people', true)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
