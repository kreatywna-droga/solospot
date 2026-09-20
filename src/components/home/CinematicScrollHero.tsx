'use client'

import React, { useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Play, Sparkles } from 'lucide-react'

const SUPABASE_HERO_VIDEO_URL =
  'https://regjgitqkyfhaaogijhu.supabase.co/storage/v1/object/public/store-assets/hero/hero-clip.mov'
const SUPABASE_HERO_POSTER_URL =
  'https://regjgitqkyfhaaogijhu.supabase.co/storage/v1/object/public/store-assets/hero/hero-poster.png'

interface CinematicScrollHeroProps {
  onExploreClick?: () => void
}

/**
 * STICKY / PINNED SCROLL-SCRUBBED VIDEO HERO
 *
 * Architecture:
 * - Outer track div: height 150vh (scroll distance = 150vh - 100vh = 50vh)
 *   User must scroll ~50vh past the hero before the next section appears.
 *   This is short enough that page feels immediately responsive.
 *
 * - Inner sticky div: height 100vh, sticky top-0
 *   Stays pinned in viewport while track is in view.
 *
 * - Scroll progress: (-rect.top / scrollDistance), clamped 0..1
 *   Drives video.currentTime frame-by-frame.
 *   No wheel interception. No preventDefault. Pure document scroll.
 *
 * - Video: absolute inset-0, object-cover — fills entire sticky viewport.
 *   Left gradient scrim ensures text readability.
 */
export function CinematicScrollHero({ onExploreClick }: CinematicScrollHeroProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const logosRef = useRef<HTMLDivElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const progressLabelRef = useRef<HTMLSpanElement>(null)
  const scrollBadgeRef = useRef<HTMLDivElement>(null)

  const prefersReducedMotion = useReducedMotion()

  // ─── High-performance scroll-scrubbing loop ──────────────────────────────
  // Uses real document scroll. No wheel/touch interception. No preventDefault.
  // requestAnimationFrame ensures 60-120 FPS with zero React state overhead.
  const handleScroll = useCallback(() => {
    if (!trackRef.current) return

    const track = trackRef.current
    const rect = track.getBoundingClientRect()
    // scrollDistance = how many pixels user must scroll for hero to fully exit
    const scrollDistance = track.offsetHeight - window.innerHeight

    if (scrollDistance <= 0) return

    // Normalized progress: 0.0 (hero at top) → 1.0 (hero fully scrolled past)
    const rawProgress = -rect.top / scrollDistance
    const progress = Math.min(Math.max(rawProgress, 0), 1)

    // 1. ── Frame-by-frame video scrubbing (Scroll-Scrubbed Video) ──────────
    //    video.currentTime is set directly — no autoplay, no play().
    //    Forward on scroll down, rewind on scroll up, pause on stop.
    const vid = videoRef.current
    if (vid && isFinite(vid.duration) && vid.duration > 0 && !prefersReducedMotion) {
      const targetTime = progress * vid.duration
      // 15ms threshold: instant response without micro-jitter
      if (Math.abs(vid.currentTime - targetTime) > 0.015) {
        vid.currentTime = targetTime
      }
    }

    // 2. ── Scrollytelling content layer ──────────────────────────────────────
    //    Subtle opacity fade — NO transform Y (prevents "page not scrolling" feel)
    if (contentRef.current) {
      const opacity = progress < 0.3 ? 1 : Math.max(1 - (progress - 0.3) * 1.8, 0.15)
      contentRef.current.style.opacity = opacity.toString()
    }

    // 3. ── Logos bar fade ────────────────────────────────────────────────────
    if (logosRef.current) {
      const logosOpacity = progress < 0.15 ? 1 : Math.max(1 - (progress - 0.15) * 5, 0)
      logosRef.current.style.opacity = logosOpacity.toString()
      logosRef.current.style.pointerEvents = logosOpacity < 0.05 ? 'none' : 'auto'
    }

    // 4. ── Progress bar indicator ────────────────────────────────────────────
    if (progressBarRef.current) {
      progressBarRef.current.style.transform = `scaleY(${Math.max(progress, 0.06)})`
    }
    if (progressLabelRef.current) {
      progressLabelRef.current.textContent = `${Math.round(progress * 100)}%`
    }

    // 5. ── Scroll helper badge fade ──────────────────────────────────────────
    if (scrollBadgeRef.current) {
      const badgeOpacity = progress < 0.04 ? 1 : Math.max(1 - progress * 5, 0)
      scrollBadgeRef.current.style.opacity = badgeOpacity.toString()
    }
  }, [prefersReducedMotion])

  useEffect(() => {
    let animId: number

    const onScrollOrResize = () => {
      cancelAnimationFrame(animId)
      animId = requestAnimationFrame(handleScroll)
    }

    // passive: true — never blocks scroll
    window.addEventListener('scroll', onScrollOrResize, { passive: true })
    window.addEventListener('resize', onScrollOrResize, { passive: true })

    // Initial pass at mount
    onScrollOrResize()

    return () => {
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
      cancelAnimationFrame(animId)
    }
  }, [handleScroll])

  const handleLoadedMetadata = () => {
    if (videoRef.current && isFinite(videoRef.current.duration)) {
      videoRef.current.currentTime = 0
    }
  }

  const scrollToNext = () => {
    if (trackRef.current) {
      const nextPos = trackRef.current.offsetTop + trackRef.current.offsetHeight
      window.scrollTo({ top: nextPos, behavior: 'smooth' })
    }
  }

  return (
    /*
     * OUTER TRACK: height 150vh
     * Defines total scroll distance for the hero sequence.
     * scroll distance = 150vh - 100vh = 50vh
     * After scrolling 50vh past hero top, the sticky container is released
     * and the page flows naturally into FlowStepsSection.
     */
    <div
      id="hero"
      ref={trackRef}
      className="relative w-full bg-[#080B10]"
      style={{ height: '150vh' }}
    >
      {/* STICKY PINNED VIEWPORT — stays in view during entire hero scroll track */}
      <div
        className="sticky top-0 h-screen w-full overflow-hidden bg-[#080B10] select-none"
      >
        {/* ── FULL-WIDTH CINEMATIC VIDEO LAYER ─────────────────────────────── */}
        {/*    Covers the entire sticky container. No walled-off sub-container. */}
        <div className="absolute inset-0">
          <video
            ref={videoRef}
            playsInline
            muted
            preload="auto"
            poster={SUPABASE_HERO_POSTER_URL}
            onLoadedMetadata={handleLoadedMetadata}
            className="w-full h-full object-cover will-change-[currentTime]"
            style={{ filter: 'brightness(0.85) contrast(1.05)' }}
            aria-hidden="true"
          >
            {/* .mov first for Safari; .mp4 fallback for all others */}
            <source src={SUPABASE_HERO_VIDEO_URL} type="video/quicktime" />
            <source src={SUPABASE_HERO_VIDEO_URL} type="video/mp4" />
          </video>
        </div>

        {/* ── OVERLAY GRADIENT SCRIMS ─────────────────────────────────────── */}
        {/* Left scrim: text readability */}
        <div
          className="absolute inset-y-0 left-0 w-[55%] pointer-events-none"
          style={{
            background: 'linear-gradient(to right, rgba(8,11,16,0.97) 0%, rgba(8,11,16,0.85) 50%, transparent 100%)',
          }}
        />
        {/* Top scrim: nav readability */}
        <div
          className="absolute top-0 inset-x-0 h-36 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(8,11,16,0.9) 0%, transparent 100%)',
          }}
        />
        {/* Bottom scrim: logos bar transition */}
        <div
          className="absolute bottom-0 inset-x-0 h-36 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(8,11,16,0.95) 0%, transparent 100%)',
          }}
        />

        {/* ── WARM AMBIENT GLOW (behind video center-right) ──────────────── */}
        <div
          className="absolute right-[10%] top-[50%] -translate-y-1/2 pointer-events-none"
          style={{
            width: '50vw',
            height: '50vw',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(217,168,108,0.18) 0%, rgba(242,194,127,0.08) 45%, transparent 70%)',
            filter: 'blur(80px)',
            opacity: 0.6,
          }}
        />

        {/* ── HERO TEXT CONTENT — Left column ─────────────────────────────── */}
        {/* Only opacity is modulated (no translateY) — page already scrolls visually */}
        <div
          ref={contentRef}
          className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 h-full flex flex-col justify-center will-change-[opacity]"
          style={{ paddingTop: '5rem' }}
        >
          <div className="max-w-xl">
            {/* Overline badge */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="inline-flex items-center gap-2 mb-5"
            >
              <span className="text-[11px] sm:text-xs font-semibold tracking-[0.22em] text-[#D9A86C] uppercase">
                E-COMMERCE OPERATING SYSTEM
              </span>
            </motion.div>

            {/* Main headline */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08, ease: 'easeOut' }}
              className="text-4xl sm:text-5xl lg:text-[68px] font-bold text-[#F5F1EA] tracking-[-0.04em] leading-[1.06]"
            >
              Twój pomysł.<br />
              <span className="text-[#F5F1EA]">Prawdziwy biznes.</span>
            </motion.h1>

            {/* Sub-headline */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.16, ease: 'easeOut' }}
              className="mt-5 text-base sm:text-lg text-[#B8B1A7] leading-relaxed max-w-lg"
            >
              SoloSpot to kompletny ekosystem do tworzenia, hostowania i skalowania
              produktów e-commerce. Od pomysłu do globalnej sprzedaży.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.24, ease: 'easeOut' }}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              <Link
                href="/register"
                className="group relative inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-[#D9A86C] via-[#F2C27F] to-[#D9A86C] text-[#080B10] font-bold text-sm tracking-tight shadow-lg shadow-[#D9A86C]/25 hover:shadow-xl hover:shadow-[#D9A86C]/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 pointer-events-auto"
              >
                <span>Zacznij budować</span>
                <ArrowRight className="w-4 h-4 text-[#080B10] group-hover:translate-x-1 transition-transform" />
              </Link>

              <button
                type="button"
                onClick={onExploreClick || scrollToNext}
                className="inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-full bg-white/[0.05] hover:bg-white/[0.09] text-[#F5F1EA] border border-white/10 hover:border-white/20 font-medium text-sm backdrop-blur-md transition-all duration-300 cursor-pointer group pointer-events-auto"
              >
                <span>Jak to działa</span>
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#D9A86C]/20 transition-colors">
                  <Play className="w-3 h-3 text-[#F5F1EA] fill-current ml-0.5 group-hover:text-[#F2C27F] transition-colors" />
                </div>
              </button>
            </motion.div>

            {/* Metrics row */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.32, ease: 'easeOut' }}
              className="mt-10 pt-7 border-t border-white/[0.08] flex items-center gap-8"
            >
              <div>
                <div className="text-2xl font-bold text-[#F2C27F] tracking-tight">10x</div>
                <div className="text-xs text-[#77736D] mt-0.5 font-medium">Szybsze wdrożenie</div>
              </div>
              <div className="h-7 w-px bg-white/[0.08]" />
              <div>
                <div className="text-2xl font-bold text-[#F2C27F] tracking-tight">0</div>
                <div className="text-xs text-[#77736D] mt-0.5 font-medium">Vendor lock-in</div>
              </div>
              <div className="h-7 w-px bg-white/[0.08]" />
              <div>
                <div className="text-2xl font-bold text-[#F2C27F] tracking-tight">∞</div>
                <div className="text-xs text-[#77736D] mt-0.5 font-medium">Możliwości</div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── FLOATING BADGE (right side) ─────────────────────────────────── */}
        <div className="hidden xl:block absolute right-20 bottom-28 pointer-events-none z-20">
          <div className="flex items-center gap-2 text-[#D9A86C]/70 font-serif italic text-lg tracking-wide">
            <span>Więcej niż sklep</span>
            <Sparkles className="w-4 h-4 text-[#F2C27F]" />
          </div>
        </div>

        {/* ── SCROLL PROGRESS INDICATOR (bottom right) ────────────────────── */}
        <div
          ref={scrollBadgeRef}
          className="absolute right-6 sm:right-10 bottom-7 z-30 flex flex-col items-center gap-2 pointer-events-none"
        >
          <span className="text-[9px] tracking-[0.28em] text-[#B8B1A7]/70 uppercase font-semibold"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
            SCROLL
          </span>
          <div className="relative w-[1px] h-12 bg-white/[0.08] rounded-full overflow-hidden">
            <div
              ref={progressBarRef}
              className="absolute top-0 inset-x-0 h-full bg-gradient-to-b from-[#D9A86C] to-[#F2C27F] origin-top"
              style={{ transform: 'scaleY(0.06)' }}
            />
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-[#D9A86C]/80 shadow-[0_0_6px_rgba(217,168,108,0.9)] animate-pulse" />
        </div>

        {/* ── BRAND LOGOS BAR ──────────────────────────────────────────────── */}
        <div
          ref={logosRef}
          className="absolute bottom-0 inset-x-0 z-10 border-t border-white/[0.05] bg-[#080B10]/75 backdrop-blur-sm py-3.5 will-change-[opacity]"
        >
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#77736D]">
              ZAUFAŁY NAM INNOWACYJNE MARKI
            </span>
            <div className="flex items-center flex-wrap justify-center gap-6 sm:gap-10 text-white/35">
              <span className="text-sm font-bold tracking-wider font-mono">NEXT<span className="text-[#D9A86C]">RA</span></span>
              <span className="text-sm font-semibold tracking-wide">pixelwear</span>
              <span className="text-sm font-medium tracking-tight">foodly</span>
              <span className="text-sm font-bold tracking-widest font-mono">mindcraft</span>
              <span className="text-sm font-semibold tracking-wider">wave</span>
              <span className="text-sm font-bold tracking-tight">wban</span>
              <span className="text-sm font-medium tracking-wide">urban</span>
              <span className="text-sm font-semibold tracking-normal">greenway</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
