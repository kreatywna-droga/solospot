'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  Play,
  Sparkles
} from 'lucide-react'

const SUPABASE_HERO_VIDEO_URL =
  'https://regjgitqkyfhaaogijhu.supabase.co/storage/v1/object/public/store-assets/hero/hero-clip.mov'
const SUPABASE_HERO_POSTER_URL =
  'https://regjgitqkyfhaaogijhu.supabase.co/storage/v1/object/public/store-assets/hero/hero-poster.png'

interface CinematicScrollHeroProps {
  onExploreClick?: () => void
}

export function CinematicScrollHero({ onExploreClick }: CinematicScrollHeroProps) {
  const containerRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const progressPercentRef = useRef<HTMLSpanElement>(null)
  const scrollIndicatorRef = useRef<HTMLDivElement>(null)

  const [videoLoaded, setVideoLoaded] = useState(false)
  const [videoDuration, setVideoDuration] = useState(15.42)
  const prefersReducedMotion = useReducedMotion()

  // Track progress and update video currentTime imperatively based on real document scroll
  const updateScrollProgress = useCallback(() => {
    if (!containerRef.current || !videoRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const heroHeight = containerRef.current.offsetHeight || window.innerHeight

    // Calculate progress based on how far the hero has scrolled through the viewport
    // rect.top is 0 at top of page, and becomes -heroHeight as hero scrolls out
    const scrollRange = Math.max(heroHeight, window.innerHeight)
    const rawProgress = -rect.top / scrollRange
    const progress = Math.min(Math.max(rawProgress, 0), 1)

    // 1. Scrub video currentTime smoothly in sync with document scroll
    const vid = videoRef.current
    if (vid && isFinite(vid.duration) && vid.duration > 0 && !prefersReducedMotion) {
      const targetTime = progress * vid.duration
      // Direct assignment with delta threshold to prevent micro-jitter
      if (Math.abs(vid.currentTime - targetTime) > 0.01) {
        vid.currentTime = targetTime
      }
    }

    // 2. Update progress indicator bar imperatively without React state re-render
    if (progressBarRef.current) {
      progressBarRef.current.style.transform = `scaleY(${Math.max(progress, 0.05)})`
    }
    if (progressPercentRef.current) {
      progressPercentRef.current.textContent = `${Math.round(progress * 100)}%`
    }

    // 3. Fade scroll indicator as user scrolls
    if (scrollIndicatorRef.current) {
      const indicatorOpacity = Math.max(1 - progress * 2.5, 0)
      scrollIndicatorRef.current.style.opacity = indicatorOpacity.toString()
    }
  }, [prefersReducedMotion])

  useEffect(() => {
    let animationFrameId: number

    const handleScroll = () => {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = requestAnimationFrame(updateScrollProgress)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })

    // Initial update
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
      cancelAnimationFrame(animationFrameId)
    }
  }, [updateScrollProgress])

  const handleLoadedMetadata = () => {
    if (videoRef.current && isFinite(videoRef.current.duration)) {
      setVideoDuration(videoRef.current.duration)
      setVideoLoaded(true)
      videoRef.current.currentTime = 0
    }
  }

  const scrollToNext = () => {
    if (containerRef.current) {
      const nextPos = containerRef.current.offsetTop + containerRef.current.offsetHeight
      window.scrollTo({ top: nextPos, behavior: 'smooth' })
    }
  }

  return (
    <section
      ref={containerRef}
      className="relative min-h-[92vh] sm:min-h-screen w-full overflow-hidden flex flex-col justify-between bg-[#080B10] select-none pt-24 sm:pt-28"
    >
      {/* Background Subtle Ambience & Warm Glow */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Deep Navy/Black Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#080B10] via-[#0D1118]/40 to-[#080B10]" />

        {/* Warm Amber Radial Glow behind 3D Product Area */}
        <div
          className="absolute right-[5%] top-[45%] -translate-y-1/2 w-[70vw] lg:w-[45vw] h-[70vw] lg:h-[45vw] rounded-full pointer-events-none opacity-40 blur-[130px]"
          style={{
            background: 'radial-gradient(circle, rgba(217,168,108,0.35) 0%, rgba(242,194,127,0.15) 45%, transparent 70%)',
          }}
        />

        {/* Left subtle ambient glow */}
        <div
          className="absolute left-[-10%] top-[30%] w-[50vw] h-[50vw] rounded-full pointer-events-none opacity-20 blur-[140px]"
          style={{
            background: 'radial-gradient(circle, rgba(217,168,108,0.2) 0%, transparent 60%)',
          }}
        />
      </div>

      {/* MAIN VISUAL LAYER — Video Scrubber on Right / Center-Right */}
      <div className="absolute inset-0 flex items-center justify-end pointer-events-none overflow-hidden">
        <div className="relative w-full lg:w-[72vw] h-full flex items-center justify-end">
          <video
            ref={videoRef}
            playsInline
            muted
            preload="auto"
            poster={SUPABASE_HERO_POSTER_URL}
            onLoadedMetadata={handleLoadedMetadata}
            className="w-full h-full object-cover lg:object-contain object-right"
            style={{
              filter: 'brightness(1.03) contrast(1.04)',
              transform: 'scale(1.02)',
            }}
            aria-hidden="true"
          >
            <source src={SUPABASE_HERO_VIDEO_URL} type="video/quicktime" />
            <source src={SUPABASE_HERO_VIDEO_URL} type="video/mp4" />
          </video>

          {/* Dark Vignette / Scrim Overlays to guarantee 100% readability */}
          {/* Left to Right Gradient Scrim */}
          <div className="absolute inset-y-0 left-0 w-[45vw] bg-gradient-to-r from-[#080B10] via-[#080B10]/85 to-transparent pointer-events-none" />

          {/* Top Scrim behind Navbar */}
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#080B10] via-[#080B10]/60 to-transparent pointer-events-none" />

          {/* Bottom Scrim above Logos */}
          <div className="absolute bottom-0 inset-x-0 h-44 bg-gradient-to-t from-[#080B10] via-[#080B10]/80 to-transparent pointer-events-none" />
        </div>
      </div>

      {/* HERO CONTENT — Left Column Layout matching reference */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-6 sm:pt-10 flex-1 flex flex-col justify-center">
        <div className="max-w-2xl">
          {/* Overline Badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 mb-4 sm:mb-6"
          >
            <span className="text-[11px] sm:text-xs font-semibold tracking-[0.22em] text-[#D9A86C] uppercase font-sans">
              E-COMMERCE OPERATING SYSTEM
            </span>
          </motion.div>

          {/* Giant Bold Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
            className="text-4xl sm:text-6xl lg:text-[72px] font-bold text-[#F5F1EA] tracking-[-0.04em] leading-[1.05] font-sans"
          >
            Twój pomysł.<br />
            <span className="text-[#F5F1EA]">Prawdziwy biznes.</span>
          </motion.h1>

          {/* Subtitle Paragraph */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
            className="mt-6 sm:mt-7 text-base sm:text-lg text-[#B8B1A7] leading-relaxed max-w-xl font-normal"
          >
            SoloSpot to kompletny ekosystem do tworzenia, hostowania i skalowania produktów e-commerce.
            Od pomysłu do globalnej sprzedaży — bez kodu, bez ograniczeń, bez vendor lock-in.
          </motion.p>

          {/* CTA Buttons Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
            className="mt-8 sm:mt-10 flex flex-wrap items-center gap-4"
          >
            <Link
              href="/register"
              className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-[#D9A86C] via-[#F2C27F] to-[#D9A86C] bg-[length:200%_auto] text-[#080B10] font-bold text-sm sm:text-base tracking-tight shadow-lg shadow-[#D9A86C]/25 hover:shadow-xl hover:shadow-[#D9A86C]/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
            >
              <span>Zacznij budować</span>
              <ArrowRight className="w-4 h-4 text-[#080B10] group-hover:translate-x-1 transition-transform" />
            </Link>

            <button
              type="button"
              onClick={onExploreClick || scrollToNext}
              className="inline-flex items-center justify-center gap-3 px-7 py-4 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-[#F5F1EA] hover:text-white border border-white/10 hover:border-white/20 font-medium text-sm sm:text-base backdrop-blur-md transition-all duration-300 cursor-pointer group"
            >
              <span>Zobacz, jak to działa</span>
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#D9A86C]/20 transition-colors">
                <Play className="w-3 h-3 text-[#F5F1EA] fill-current ml-0.5 group-hover:text-[#F2C27F] transition-colors" />
              </div>
            </button>
          </motion.div>

          {/* Metrics Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: 'easeOut' }}
            className="mt-10 sm:mt-12 pt-8 border-t border-white/[0.08] flex items-center gap-6 sm:gap-10"
          >
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-[#F2C27F] tracking-tight">10x</div>
              <div className="text-xs text-[#77736D] mt-0.5 font-medium">Szybsze wdrożenie</div>
            </div>
            <div className="h-8 w-[1px] bg-white/[0.08]" />
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-[#F2C27F] tracking-tight">0</div>
              <div className="text-xs text-[#77736D] mt-0.5 font-medium">Vendor lock-in</div>
            </div>
            <div className="h-8 w-[1px] bg-white/[0.08]" />
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-[#F2C27F] tracking-tight">∞</div>
              <div className="text-xs text-[#77736D] mt-0.5 font-medium">Możliwości rozwoju</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* RIGHT SIDE FLOATING "Więcej niż sklep" TAG */}
      <div className="hidden xl:block absolute right-24 bottom-32 pointer-events-none z-20">
        <div className="flex items-center gap-2 text-[#D9A86C]/80 font-serif italic text-lg tracking-wide drop-shadow-md">
          <span>Więcej niż sklep</span>
          <Sparkles className="w-4 h-4 text-[#F2C27F]" />
        </div>
      </div>

      {/* BOTTOM RIGHT SCROLL INDICATOR */}
      <div
        ref={scrollIndicatorRef}
        className="absolute right-8 sm:right-12 bottom-24 z-30 flex flex-col items-center gap-3 transition-opacity duration-300 pointer-events-none"
      >
        <span className="text-[10px] tracking-[0.25em] text-[#B8B1A7] uppercase font-semibold rotate-90 translate-y-[-10px] origin-right">
          PRZEWIŃ I ODKRYJ
        </span>
        <div className="relative w-[2px] h-14 bg-white/10 rounded-full overflow-hidden mt-6">
          <div
            ref={progressBarRef}
            className="absolute top-0 inset-x-0 h-full bg-gradient-to-b from-[#D9A86C] to-[#F2C27F] origin-top transition-transform duration-75 ease-out"
            style={{ transform: 'scaleY(0.08)' }}
          />
        </div>
        <div className="w-2 h-2 rounded-full bg-[#D9A86C] shadow-[0_0_8px_rgba(217,168,108,0.8)] animate-pulse" />
      </div>

      {/* BOTTOM BRAND TRUST LOGOS BAR */}
      <div className="relative z-10 w-full border-t border-white/[0.06] bg-[#080B10]/80 backdrop-blur-md py-4 sm:py-5 mt-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#77736D]">
            ZAUFAŁY NAM INNOWACYJNE MARKI
          </span>

          <div className="flex items-center flex-wrap justify-center gap-6 sm:gap-10 text-white/40 hover:text-white/60 transition-colors">
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
    </section>
  )
}
