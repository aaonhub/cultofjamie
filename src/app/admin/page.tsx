'use client'

import { useState } from 'react'
import { SiteData, Term, FAQEntry } from '@/lib/types'
import styles from './admin.module.css'

type AdminTab = 'terms' | 'faq' | 'people' | 'categories'

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [data, setData] = useState<SiteData | null>(null)
  const [sha, setSha] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState<AdminTab>('terms')
  const [selectedPerson, setSelectedPerson] = useState('')

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
      setAuthenticated(true)
      setPassword('')
      loadData()
    } else {
      setError('Invalid password')
    }
  }

  async function loadData() {
    const res = await fetch('/api/save')
    if (res.ok) {
      const result = await res.json()
      const siteData = result.dictionary as SiteData
      setData(siteData)
      setSha(result.sha)
      if (!selectedPerson && siteData.people.length > 0) {
        setSelectedPerson(siteData.people[0])
      }
    } else if (res.status === 401) {
      setAuthenticated(false)
    } else {
      setError('Failed to load data')
    }
  }

  async function handleSave() {
    if (!data) return
    setSaving(true)
    setError('')
    setSuccess('')
    const res = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dictionary: data, sha }),
    })
    if (res.ok) {
      setSuccess('Saved! Site will rebuild in ~30 seconds.')
      await loadData()
    } else {
      const result = await res.json()
      setError(result.error || 'Failed to save')
    }
    setSaving(false)
  }

  function generateId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  // --- People ---
  function addPerson(name: string) {
    if (!data || !name.trim()) return
    if (data.people.includes(name.trim())) return
    const updated = { ...data, people: [...data.people, name.trim()] }
    setData(updated)
    if (!selectedPerson) setSelectedPerson(name.trim())
  }

  function removePerson(name: string) {
    if (!data) return
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
    if (!data) return
    const newTerm: Term = {
      id: `new-term-${Date.now()}`,
      name: '',
      category: data.categories[0] || '',
      definitions: {},
    }
    setData({ ...data, terms: [...data.terms, newTerm] })
  }

  function updateTermField(index: number, field: 'name' | 'category', value: string) {
    if (!data) return
    const updated = [...data.terms]
    updated[index] = { ...updated[index], [field]: value }
    if (field === 'name') {
      updated[index].id = generateId(value)
    }
    setData({ ...data, terms: updated })
  }

  function updateTermDefinition(index: number, person: string, value: string) {
    if (!data) return
    const updated = [...data.terms]
    updated[index] = {
      ...updated[index],
      definitions: { ...updated[index].definitions, [person]: value },
    }
    setData({ ...data, terms: updated })
  }

  function deleteTerm(index: number) {
    if (!data) return
    if (!confirm('Delete this term?')) return
    setData({ ...data, terms: data.terms.filter((_, i) => i !== index) })
  }

  // --- FAQ ---
  function addFAQ() {
    if (!data) return
    const newFAQ: FAQEntry = {
      id: `faq-${Date.now()}`,
      question: '',
      answers: {},
    }
    setData({ ...data, faq: [...data.faq, newFAQ] })
  }

  function updateFAQQuestion(index: number, question: string) {
    if (!data) return
    const updated = [...data.faq]
    updated[index] = { ...updated[index], question }
    updated[index].id = generateId(question || `faq-${Date.now()}`)
    setData({ ...data, faq: updated })
  }

  function updateFAQAnswer(index: number, person: string, value: string) {
    if (!data) return
    const updated = [...data.faq]
    updated[index] = {
      ...updated[index],
      answers: { ...updated[index].answers, [person]: value },
    }
    setData({ ...data, faq: updated })
  }

  function deleteFAQ(index: number) {
    if (!data) return
    if (!confirm('Delete this FAQ?')) return
    setData({ ...data, faq: data.faq.filter((_, i) => i !== index) })
  }

  // --- Categories ---
  function addCategory(name: string) {
    if (!data || !name.trim()) return
    if (data.categories.includes(name.trim())) return
    setData({ ...data, categories: [...data.categories, name.trim()] })
  }

  function deleteCategory(cat: string) {
    if (!data) return
    const usedBy = data.terms.filter((t) => t.category === cat)
    if (usedBy.length > 0) {
      alert(`Cannot delete "${cat}" — ${usedBy.length} term(s) still use it.`)
      return
    }
    if (!confirm(`Delete category "${cat}"?`)) return
    setData({ ...data, categories: data.categories.filter((c) => c !== cat) })
  }

  // --- Login Screen ---
  if (!authenticated) {
    return (
      <div className={styles.container}>
        <h1>Admin</h1>
        <form onSubmit={handleLogin} className={styles.loginForm}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            autoFocus
          />
          <button type="submit">Login</button>
        </form>
        {error && <p className={styles.error}>{error}</p>}
      </div>
    )
  }

  if (!data) {
    return (
      <div className={styles.container}>
        <p>Loading...</p>
      </div>
    )
  }

  // --- Main Editor ---
  return (
    <div className={styles.container}>
      <h1>Site Editor</h1>

      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}

      <div className={styles.adminTabs}>
        <div className={styles.tabButtons}>
          {(['terms', 'faq', 'people', 'categories'] as AdminTab[]).map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        <button
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save & Publish'}
        </button>
      </div>

      {/* Person selector for Terms and FAQ tabs */}
      {(activeTab === 'terms' || activeTab === 'faq') && (
        <div className={styles.personSelect}>
          <label>
            Editing as:
            <select
              value={selectedPerson}
              onChange={(e) => setSelectedPerson(e.target.value)}
            >
              {data.people.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {/* Terms Tab */}
      {activeTab === 'terms' && (
        <div>
          <div className={styles.toolbar}>
            <button onClick={addTerm}>+ Add Term</button>
          </div>
          {data.terms.map((term, index) => (
            <div key={term.id || index} className={styles.termCard}>
              <div className={styles.termFields}>
                <label>
                  Name
                  <input
                    type="text"
                    value={term.name}
                    onChange={(e) => updateTermField(index, 'name', e.target.value)}
                  />
                </label>
                <label>
                  Category
                  <select
                    value={term.category}
                    onChange={(e) => updateTermField(index, 'category', e.target.value)}
                  >
                    {data.categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {selectedPerson}&apos;s definition
                  <textarea
                    value={term.definitions[selectedPerson] || ''}
                    onChange={(e) =>
                      updateTermDefinition(index, selectedPerson, e.target.value)
                    }
                    rows={3}
                    placeholder={`${selectedPerson}'s definition for ${term.name || 'this term'}...`}
                  />
                </label>
              </div>
              <button
                className={styles.deleteBtn}
                onClick={() => deleteTerm(index)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {/* FAQ Tab */}
      {activeTab === 'faq' && (
        <div>
          <div className={styles.toolbar}>
            <button onClick={addFAQ}>+ Add Question</button>
          </div>
          {data.faq.map((faq, index) => (
            <div key={faq.id || index} className={styles.termCard}>
              <div className={styles.termFields}>
                <label>
                  Question
                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => updateFAQQuestion(index, e.target.value)}
                  />
                </label>
                <label>
                  {selectedPerson}&apos;s answer
                  <textarea
                    value={faq.answers[selectedPerson] || ''}
                    onChange={(e) =>
                      updateFAQAnswer(index, selectedPerson, e.target.value)
                    }
                    rows={4}
                    placeholder={`${selectedPerson}'s answer...`}
                  />
                </label>
              </div>
              <button
                className={styles.deleteBtn}
                onClick={() => deleteFAQ(index)}
              >
                Delete
              </button>
            </div>
          ))}
          {data.faq.length === 0 && (
            <p className={styles.emptyState}>
              No FAQ questions yet. Click &quot;+ Add Question&quot; to create one.
            </p>
          )}
        </div>
      )}

      {/* People Tab */}
      {activeTab === 'people' && (
        <div className={styles.categorySection}>
          <ul>
            {data.people.map((person) => (
              <li key={person}>
                {person}
                <button
                  className={styles.deleteCatBtn}
                  onClick={() => removePerson(person)}
                >
                  &times;
                </button>
              </li>
            ))}
          </ul>
          <form
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
            <button type="submit">Add Person</button>
          </form>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className={styles.categorySection}>
          <ul>
            {data.categories.map((cat) => (
              <li key={cat}>
                {cat}
                <button
                  className={styles.deleteCatBtn}
                  onClick={() => deleteCategory(cat)}
                >
                  &times;
                </button>
              </li>
            ))}
          </ul>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const input = (e.target as HTMLFormElement).elements.namedItem(
                'newCat'
              ) as HTMLInputElement
              addCategory(input.value)
              input.value = ''
            }}
          >
            <input name="newCat" type="text" placeholder="New category name" />
            <button type="submit">Add Category</button>
          </form>
        </div>
      )}
    </div>
  )
}
