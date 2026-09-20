'use client'

import React, { useEffect, useState, useCallback } from 'react'

/**
 * SECTION PROGRESS INDICATOR
 *
 * A fixed, right-side vertical bar showing which page section is active.
 * Synchronized with the single Global Scroll Timeline (window.scrollY).
 * Each tick = one horizontal dash representing one section.
 * Active section = brighter, wider dash with gold glow.
 *
 * Click on a dash → smooth scroll to that section.
 * Hidden on mobile (< md breakpoint) to avoid layout conflicts.
 */

interface Section {
  id: string
  label: string
}

const SECTIONS: Section[] = [
  { id: 'hero',             label: 'Hero' },
  { id: 'features',        label: 'Jak to działa' },
  { id: 'stack',           label: 'Stos platformy' },
  { id: 'architecture',    label: 'Architektura' },
  { id: 'marketplace',     label: 'Marketplace' },
  { id: 'studio',          label: 'Studio' },
  { id: 'runtime',         label: 'Runtime' },
  { id: 'export',          label: 'Export HTML' },
  { id: 'mission-control', label: 'Mission Control' },
  { id: 'why',             label: 'Dlaczego SoloSpot' },
  { id: 'integrations',    label: 'Integracje' },
  { id: 'pricing',         label: 'Cennik' },
  { id: 'faq',             label: 'FAQ' },
  { id: 'cta',             label: 'Zacznij' },
]

export function SectionProgressIndicator() {
  const [activeId, setActiveId] = useState<string>('hero')

  const updateActiveSection = useCallback(() => {
    const scrollY = window.scrollY
    const viewportHeight = window.innerHeight
    const docHeight = document.documentElement.scrollHeight

    // 1. Top of page: always Hero
    if (scrollY < 80) {
      setActiveId('hero')
      return
    }

    // 2. Bottom of page: always CTA
    if (scrollY + viewportHeight >= docHeight - 80) {
      setActiveId('cta')
      return
    }

    // 3. Inspection line: 35% from the top of the viewport
    const inspectLine = scrollY + viewportHeight * 0.35

    let current = SECTIONS[0].id
    for (const section of SECTIONS) {
      const el = document.getElementById(section.id)
      if (el) {
        const top = el.offsetTop
        if (top <= inspectLine) {
          current = section.id
        }
      }
    }
    setActiveId(current)
  }, [])

  useEffect(() => {
    let animId: number

    const onScroll = () => {
      cancelAnimationFrame(animId)
      animId = requestAnimationFrame(updateActiveSection)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    updateActiveSection()

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(animId)
    }
  }, [updateActiveSection])

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <nav
      aria-label="Nawigacja sekcji"
      className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col items-end gap-3"
    >
      {SECTIONS.map((section) => {
        const isActive = activeId === section.id

        return (
          <button
            key={section.id}
            type="button"
            onClick={() => scrollToSection(section.id)}
            title={section.label}
            aria-label={`Przejdź do sekcji: ${section.label}`}
            aria-current={isActive ? 'true' : undefined}
            className="group relative flex items-center justify-end cursor-pointer focus:outline-none"
            style={{ padding: '4px 0' }}
          >
            {/* Tooltip label */}
            <span
              className="absolute right-full mr-3 text-[10px] font-medium text-[#B8B1A7] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
            >
              {section.label}
            </span>

            {/* The dash */}
            <span
              style={{
                display: 'block',
                height: '2px',
                borderRadius: '2px',
                transition:
                  'width 250ms ease, opacity 250ms ease, box-shadow 250ms ease, background-color 250ms ease',
                width: isActive ? '28px' : '12px',
                opacity: isActive ? 1 : 0.3,
                backgroundColor: isActive ? '#D9A86C' : '#B8B1A7',
                boxShadow: isActive
                  ? '0 0 8px rgba(217,168,108,0.9), 0 0 16px rgba(217,168,108,0.4)'
                  : 'none',
              }}
            />
          </button>
        )
      })}
    </nav>
  )
}
