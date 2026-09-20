'use client'

import React, { useEffect, useRef, useState } from 'react'

/**
 * SECTION PROGRESS INDICATOR
 *
 * A fixed, right-side vertical bar showing which page section is active.
 * Uses IntersectionObserver — no separate scroll engine.
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
  { id: 'cta',             label: 'Zacznij' },
]

export function SectionProgressIndicator() {
  const [activeId, setActiveId] = useState<string>('hero')
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    // Map of sectionId → timestamp when it entered viewport (most recent wins)
    const visibleMap = new Map<string, number>()

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const now = Date.now()
        entries.forEach((entry) => {
          const id = entry.target.id
          if (!id) return
          if (entry.isIntersecting) {
            visibleMap.set(id, now)
          } else {
            visibleMap.delete(id)
          }
        })

        // Pick the section closest to viewport top (most recently visible wins
        // among tied timestamps; fallback to SECTIONS order)
        if (visibleMap.size > 0) {
          // Sort by SECTIONS order and pick first visible
          const ordered = SECTIONS.filter((s) => visibleMap.has(s.id))
          if (ordered.length > 0) {
            setActiveId(ordered[0].id)
          }
        }
      },
      {
        // Consider section active when >=30% visible
        threshold: [0.3],
        rootMargin: '0px 0px -20% 0px',
      }
    )

    const observer = observerRef.current

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

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
                transition: 'width 250ms ease, opacity 250ms ease, box-shadow 250ms ease, background-color 250ms ease',
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
