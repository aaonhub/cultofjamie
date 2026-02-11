'use client'

import { useState } from 'react'
import { Dictionary, Term } from '@/lib/types'
import styles from './admin.module.css'

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [dictionary, setDictionary] = useState<Dictionary | null>(null)
  const [sha, setSha] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
      loadDictionary()
    } else {
      setError('Invalid password')
    }
  }

  async function loadDictionary() {
    const res = await fetch('/api/save')
    if (res.ok) {
      const data = await res.json()
      setDictionary(data.dictionary)
      setSha(data.sha)
    } else if (res.status === 401) {
      setAuthenticated(false)
    } else {
      setError('Failed to load dictionary')
    }
  }

  async function handleSave() {
    if (!dictionary) return
    setSaving(true)
    setError('')
    setSuccess('')

    const res = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dictionary, sha }),
    })

    if (res.ok) {
      setSuccess('Saved! Site will rebuild in ~30 seconds.')
      await loadDictionary()
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to save')
    }
    setSaving(false)
  }

  function generateId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  function addTerm() {
    if (!dictionary) return
    const newTerm: Term = {
      id: `new-term-${Date.now()}`,
      name: '',
      definition: '',
      category: dictionary.categories[0] || '',
    }
    setDictionary({
      ...dictionary,
      terms: [...dictionary.terms, newTerm],
    })
  }

  function updateTerm(index: number, field: keyof Term, value: string) {
    if (!dictionary) return
    const updated = [...dictionary.terms]
    updated[index] = { ...updated[index], [field]: value }
    if (field === 'name') {
      updated[index].id = generateId(value)
    }
    setDictionary({ ...dictionary, terms: updated })
  }

  function deleteTerm(index: number) {
    if (!dictionary) return
    if (!confirm('Delete this term?')) return
    const updated = dictionary.terms.filter((_, i) => i !== index)
    setDictionary({ ...dictionary, terms: updated })
  }

  function addCategory(newCat: string) {
    if (!dictionary || !newCat.trim()) return
    if (!dictionary.categories.includes(newCat.trim())) {
      setDictionary({
        ...dictionary,
        categories: [...dictionary.categories, newCat.trim()],
      })
    }
  }

  function deleteCategory(cat: string) {
    if (!dictionary) return
    const usedBy = dictionary.terms.filter((t) => t.category === cat)
    if (usedBy.length > 0) {
      alert(`Cannot delete "${cat}" — ${usedBy.length} term(s) still use it.`)
      return
    }
    if (!confirm(`Delete category "${cat}"?`)) return
    setDictionary({
      ...dictionary,
      categories: dictionary.categories.filter((c) => c !== cat),
    })
  }

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

  if (!dictionary) {
    return (
      <div className={styles.container}>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <h1>Dictionary Editor</h1>

      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}

      <div className={styles.toolbar}>
        <button onClick={addTerm}>+ Add Term</button>
        <button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save & Publish'}
        </button>
      </div>

      {dictionary.terms.map((term, index) => (
        <div key={term.id || index} className={styles.termCard}>
          <div className={styles.termFields}>
            <label>
              Name
              <input
                type="text"
                value={term.name}
                onChange={(e) => updateTerm(index, 'name', e.target.value)}
              />
            </label>
            <label>
              Category
              <select
                value={term.category}
                onChange={(e) => updateTerm(index, 'category', e.target.value)}
              >
                {dictionary.categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Definition
              <textarea
                value={term.definition}
                onChange={(e) =>
                  updateTerm(index, 'definition', e.target.value)
                }
                rows={3}
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

      <div className={styles.categorySection}>
        <h2>Manage Categories</h2>
        <ul>
          {dictionary.categories.map((cat) => (
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
    </div>
  )
}
