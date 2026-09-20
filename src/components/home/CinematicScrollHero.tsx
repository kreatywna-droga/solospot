'use client'

import React, { useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Play } from 'lucide-react'

const SUPABASE_HERO_VIDEO_URL =
  'https://regjgitqkyfhaaogijhu.supabase.co/storage/v1/object/public/store-assets/hero/hero-clip.mov'
const SUPABASE_HERO_POSTER_URL =
  'https://regjgitqkyfhaaogijhu.supabase.co/storage/v1/object/public/store-assets/hero/hero-poster.png'

interface CinematicScrollHeroProps {
  onExploreClick?: () => void
}

/**
 * TRUE SCROLL-SYNCHRONIZED CINEMATIC HERO
 *
 * Architecture:
 * - Single Source of Truth: window.scrollY (Real document scroll position)
 * - Normal Document Flow: Hero is min-h-screen, immediately scrolls into next sections
 *   (Zero scroll locks, zero artificial sticky pauses, zero wheel hijacking)
 * - Fixed Cinematic Backdrop: Video stays visible in the background from Hero (0%)
 *   through FlowSteps (features) and Stack (stack) up to Architecture (architecture, 100%).
 *   Beyond Architecture, the video gracefully fades out and the rest of the page continues.
 */
export function CinematicScrollHero({ onExploreClick }: CinematicScrollHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoBackdropRef = useRef<HTMLDivElement>(null)
  const heroSectionRef = useRef<HTMLElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const progressLabelRef = useRef<HTMLSpanElement>(null)
  const scrollBadgeRef = useRef<HTMLDivElement>(null)

  const prefersReducedMotion = useReducedMotion()

  // ── High-Performance Unified Scroll Handler ──────────────────────────────
  const handleScroll = useCallback(() => {
    const scrollY = window.scrollY
    const viewportHeight = window.innerHeight

    // Measure active range: video completes at end of #architecture section
    const archEl = document.getElementById('architecture')
    const videoEndScroll = archEl
      ? Math.max(archEl.offsetTop + archEl.offsetHeight * 0.7 - viewportHeight, 1200)
      : Math.max(viewportHeight * 2.5, 1200)

    // Global timeline progress for video: 0.0 (top) → 1.0 (end of architecture)
    const rawProgress = scrollY / videoEndScroll
    const videoProgress = Math.min(Math.max(rawProgress, 0), 1)

    // 1. ── Scrub Video frame-by-frame ───────────────────────────────────────
    const vid = videoRef.current
    if (vid && isFinite(vid.duration) && vid.duration > 0 && !prefersReducedMotion) {
      const targetTime = videoProgress * vid.duration
      if (Math.abs(vid.currentTime - targetTime) > 0.015) {
        vid.currentTime = targetTime
      }
    }

    // 2. ── Backdrop Opacity & Visibility Modulation ─────────────────────────
    // Stays 100% visible throughout Hero → Features → Stack → Architecture.
    // Fades to 0 over 400px past architecture, then hidden for zero GPU overhead.
    if (videoBackdropRef.current) {
      if (scrollY <= videoEndScroll) {
        videoBackdropRef.current.style.opacity = '1'
        videoBackdropRef.current.style.visibility = 'visible'
      } else {
        const fadeOut = Math.min(Math.max((scrollY - videoEndScroll) / 400, 0), 1)
        const opacity = 1 - fadeOut
        videoBackdropRef.current.style.opacity = opacity.toString()
        videoBackdropRef.current.style.visibility = opacity <= 0.01 ? 'hidden' : 'visible'
      }
    }

    // 3. ── Hero Micro-indicators ────────────────────────────────────────────
    if (progressBarRef.current) {
      progressBarRef.current.style.transform = `scaleY(${Math.max(videoProgress, 0.06)})`
    }
    if (progressLabelRef.current) {
      progressLabelRef.current.textContent = `${Math.round(videoProgress * 100)}%`
    }

    // Fade out scroll helper as soon as user starts scrolling past hero
    if (scrollBadgeRef.current) {
      const badgeOpacity = scrollY < 40 ? 1 : Math.max(1 - (scrollY - 40) / 120, 0)
      scrollBadgeRef.current.style.opacity = badgeOpacity.toString()
    }
  }, [prefersReducedMotion])

  useEffect(() => {
    let animId: number

    const onScrollOrResize = () => {
      cancelAnimationFrame(animId)
      animId = requestAnimationFrame(handleScroll)
    }

    window.addEventListener('scroll', onScrollOrResize, { passive: true })
    window.addEventListener('resize', onScrollOrResize, { passive: true })

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
    const el = document.getElementById('features')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <>
      {/* ── 1. FIXED BACKGROUND VIDEO LAYER ────────────────────────────────── */}
      {/* Covers viewport behind Hero and first sections. Never locks page.   */}
      <div
        ref={videoBackdropRef}
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-[#080B10] will-change-[opacity]"
        style={{ opacity: 1 }}
        aria-hidden="true"
      >
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
          >
            <source src={SUPABASE_HERO_VIDEO_URL} type="video/quicktime" />
            <source src={SUPABASE_HERO_VIDEO_URL} type="video/mp4" />
          </video>
        </div>

        {/* Overlay gradient scrims */}
        {/* Left scrim: ensures text readability on Hero and subsequent sections */}
        <div
          className="absolute inset-y-0 left-0 w-[55%] pointer-events-none"
          style={{
            background:
              'linear-gradient(to right, rgba(8,11,16,0.97) 0%, rgba(8,11,16,0.85) 50%, transparent 100%)',
          }}
        />
        {/* Top scrim: nav readability */}
        <div
          className="absolute top-0 inset-x-0 h-36 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(8,11,16,0.9) 0%, transparent 100%)',
          }}
        />
        {/* Bottom scrim */}
        <div
          className="absolute bottom-0 inset-x-0 h-36 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(8,11,16,0.95) 0%, transparent 100%)',
          }}
        />

        {/* Warm ambient glow (behind video center-right) */}
        <div
          className="absolute right-[10%] top-[50%] -translate-y-1/2 pointer-events-none"
          style={{
            width: '50vw',
            height: '50vw',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(217,168,108,0.18) 0%, rgba(242,194,127,0.08) 45%, transparent 70%)',
            filter: 'blur(80px)',
            opacity: 0.6,
          }}
        />
      </div>

      {/* ── 2. HERO FOREGROUND SECTION (Normal Document Flow) ──────────────── */}
      {/* min-h-screen flex items-center: perfectly vertically centers hero content */}
      <section
        id="hero"
        ref={heroSectionRef}
        className="relative z-10 w-full min-h-screen flex items-center select-none"
      >
        {/* HERO TEXT CONTENT — Left column */}
        <div
          className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex items-center"
          style={{ paddingTop: '5.5rem', paddingBottom: '2.5rem' }}
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

        {/* SCROLL HELPER BADGE (bottom right) */}
        <div
          ref={scrollBadgeRef}
          className="absolute right-6 sm:right-10 bottom-8 z-30 flex flex-col items-center gap-2 pointer-events-none transition-opacity duration-300"
        >
          <span
            className="text-[9px] tracking-[0.28em] text-[#B8B1A7]/70 uppercase font-semibold"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
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
      </section>
    </>
  )
}
