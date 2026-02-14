'use client'

import { useEffect, useState, useCallback } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('theme')
    if (saved === 'light') {
      setDark(false)
      document.documentElement.classList.remove('dark')
    } else {
      setDark(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const flashbang = useCallback(() => {
    const overlay = document.createElement('div')
    overlay.className = 'flashbang-overlay'
    document.body.appendChild(overlay)
    overlay.addEventListener('animationend', () => overlay.remove())
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    if (next) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      flashbang()
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  if (!mounted) return null

  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '1.25rem',
        padding: '0.25rem',
        lineHeight: 1,
        color: 'var(--color-muted)',
      }}
    >
      {dark ? '\u2600' : '\u263E'}
    </button>
  )
}
