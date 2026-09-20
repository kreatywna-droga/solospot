'use client';

import React, { useState, useMemo } from 'react';
import {
  X, Monitor, Tablet, Smartphone, Play, Pause, RotateCcw,
  Sparkles, Layers, ArrowRight, ArrowUp, ArrowDown, Replace,
  Globe, Check, Image as ImageIcon, Video, Eye,
  MousePointerClick, Sliders, Box, Film, ShieldCheck,
} from 'lucide-react';
import type { ExperienceItem } from '@/lib/experience/ExperienceTypes';
import { SectionPreviewRenderer, ScaleToFitContainer } from '../library/SectionPreviewRenderer';
import { insertExperienceToCanvas, type InsertionContext } from '@/lib/experience/ExperienceInsertionEngine';
import { useBuilder } from '../state/BuilderProvider';

interface ExperienceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  experience: ExperienceItem | null;
  insertIndex?: number;
  onInserted?: (nodeId: string) => void;
}

export function ExperienceDetailModal({
  isOpen,
  onClose,
  experience,
  insertIndex,
  onInserted,
}: ExperienceDetailModalProps) {
  const { document, canvas, dispatch } = useBuilder();
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isPlayingMotion, setIsPlayingMotion] = useState(true);
  const [isInteractive, setIsInteractive] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showInsertionMenu, setShowInsertionMenu] = useState(false);
  const [insertedSuccess, setInsertedSuccess] = useState(false);

  const activePageId = canvas.selectedPageId || document.pages[0]?.id;
  const selectedSectionId = canvas.selectedSectionId;

  // Memoize rendered preview node
  const previewNode = useMemo(() => {
    if (!experience) return null;
    return experience.createNode();
  }, [experience]);

  if (!isOpen || !experience || !previewNode) return null;

  const targetWidth = viewport === 'desktop' ? 1080 : viewport === 'tablet' ? 768 : 375;

  const handleApply = (mode: 'add' | 'above' | 'below' | 'replace' | 'page') => {
    if (!activePageId) return;

    const ctx: InsertionContext = {
      document,
      pageId: activePageId,
      selectedSectionId,
      insertIndex,
      dispatch,
    };

    const res = insertExperienceToCanvas(experience, ctx, mode);
    if (res.success && res.insertedNodeId) {
      setInsertedSuccess(true);
      if (onInserted) onInserted(res.insertedNodeId);
      setTimeout(() => {
        setInsertedSuccess(false);
        onClose();
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/90 backdrop-blur-md p-2 md:p-6 animate-in fade-in select-none">
      <div
        className="w-full max-w-6xl max-h-[95vh] bg-[#14141c] border border-[#272736] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-[#252535] bg-[#191924] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-md border border-[#D9A86C]/20">
              {experience.type}
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-white truncate flex items-center gap-2">
                <span>{experience.name}</span>
                {experience.badge && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-[#D9A86C]/40">
                    {experience.badge}
                  </span>
                )}
              </h2>
              <p className="text-xs text-zinc-400 truncate mt-0.5">
                {experience.tagline || experience.description}
              </p>
            </div>
          </div>

          {/* Viewport Switcher Controls */}
          <div className="flex items-center gap-1.5 bg-[#101018] p-1 rounded-xl border border-[#2c2c3e]">
            <button
              onClick={() => setViewport('desktop')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewport === 'desktop' ? 'bg-[#D9A86C] text-white shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
              title="Desktop (1080px preview)"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Desktop</span>
            </button>
            <button
              onClick={() => setViewport('tablet')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewport === 'tablet' ? 'bg-[#D9A86C] text-white shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
              title="Tablet (768px preview)"
            >
              <Tablet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tablet</span>
            </button>
            <button
              onClick={() => setViewport('mobile')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewport === 'mobile' ? 'bg-[#D9A86C] text-white shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
              title="Mobile (375px preview)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mobile</span>
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Two columns (Live Preview + Sidebar Info) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Main Live Preview Area */}
          <div className="flex-1 bg-[#090912] p-4 md:p-8 flex flex-col items-center justify-center overflow-y-auto relative">
            {/* Live Preview Controls Floating Header */}
            <div className="absolute top-4 left-6 right-6 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
              <div className="flex items-center gap-2 bg-[#161622]/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-xs text-zinc-300 pointer-events-auto shadow-lg">
                <button
                  onClick={() => setIsPlayingMotion(!isPlayingMotion)}
                  className="flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  {isPlayingMotion ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
                  <span>{isPlayingMotion ? 'Pause' : 'Play'}</span>
                </button>
                <div className="w-px h-3 bg-white/20" />
                <button
                  onClick={() => {
                    setIsPlayingMotion(false);
                    setScrollProgress(0);
                    setTimeout(() => setIsPlayingMotion(true), 50);
                  }}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                  title="Reset Motion & Scroll"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
                <div className="w-px h-3 bg-white/20" />
                <button
                  onClick={() => setIsInteractive(!isInteractive)}
                  className={`flex items-center gap-1.5 transition-colors ${isInteractive ? 'text-violet-300 font-semibold' : 'text-zinc-400 hover:text-white'}`}
                  title="Toggle interactive mode (hover, click, drag)"
                >
                  <MousePointerClick className="w-3 h-3 text-violet-400" />
                  <span>{isInteractive ? 'Interactive: ON' : 'Interactive: OFF'}</span>
                </button>
              </div>

              {/* Scroll Simulation Slider */}
              <div className="flex items-center gap-2 bg-[#161622]/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-xs text-zinc-300 pointer-events-auto shadow-lg">
                <Sliders className="w-3 h-3 text-violet-400" />
                <span className="text-[11px] text-zinc-400 font-medium hidden sm:inline">Scroll Sim:</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={scrollProgress}
                  onChange={(e) => setScrollProgress(Number(e.target.value))}
                  className="w-20 md:w-28 accent-[#D9A86C] cursor-pointer h-1.5 bg-[#252535] rounded-lg"
                  title={`Simulated scroll progress: ${scrollProgress}%`}
                />
                <span className="font-mono text-[11px] text-violet-300 w-8 text-right">{scrollProgress}%</span>
              </div>
            </div>

            {/* Scale To Fit Live Canvas Preview */}
            <div
              className={`transition-all duration-300 ease-out flex justify-center w-full ${
                viewport === 'mobile' ? 'max-w-[420px]' : viewport === 'tablet' ? 'max-w-[820px]' : 'max-w-[1120px]'
              }`}
            >
              <ScaleToFitContainer targetWidth={targetWidth} maxHeight={520} interactive={isInteractive}>
                <SectionPreviewRenderer
                  sectionNode={previewNode}
                  isPlaying={isPlayingMotion}
                  isInteractive={isInteractive}
                  scrollProgress={scrollProgress}
                  runtimeConfig={experience.runtimeConfig}
                />
              </ScaleToFitContainer>
            </div>
          </div>

          {/* Details & Action Panel */}
          <div className="w-full lg:w-80 bg-[#171722] border-t lg:border-t-0 lg:border-l border-[#272736] p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              {/* Description Block */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">About this Experience</h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {experience.description}
                </p>
              </div>

              {/* Capabilities Checklist */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
                  <span>Runtime Capabilities</span>
                </h4>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <div className="bg-[#11111a] px-2.5 py-1.5 rounded-lg border border-[#252535] flex items-center gap-1.5 text-zinc-300">
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Live Preview</span>
                  </div>
                  <div className="bg-[#11111a] px-2.5 py-1.5 rounded-lg border border-[#252535] flex items-center gap-1.5 text-zinc-300">
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Responsive</span>
                  </div>
                  {experience.capabilities?.perspective3d && (
                    <div className="bg-[#11111a] px-2.5 py-1.5 rounded-lg border border-[#252535] flex items-center gap-1.5 text-violet-300 font-semibold">
                      <Box className="w-3 h-3 text-violet-400" />
                      <span>CSS 3D Depth</span>
                    </div>
                  )}
                  {experience.capabilities?.backgroundVideo && (
                    <div className="bg-[#11111a] px-2.5 py-1.5 rounded-lg border border-[#252535] flex items-center gap-1.5 text-violet-300 font-semibold">
                      <Film className="w-3 h-3 text-violet-400" />
                      <span>Video Ready</span>
                    </div>
                  )}
                  {experience.capabilities?.scrollAnimation && (
                    <div className="bg-[#11111a] px-2.5 py-1.5 rounded-lg border border-[#252535] flex items-center gap-1.5 text-violet-300 font-semibold">
                      <Sliders className="w-3 h-3 text-violet-400" />
                      <span>Scroll Motion</span>
                    </div>
                  )}
                  {experience.capabilities?.gradient && (
                    <div className="bg-[#11111a] px-2.5 py-1.5 rounded-lg border border-[#252535] flex items-center gap-1.5 text-violet-300 font-semibold">
                      <Sparkles className="w-3 h-3 text-violet-400" />
                      <span>Mesh Glow</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Taxonomy Metadata */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Attributes</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#11111a] p-2.5 rounded-xl border border-[#272738]">
                    <span className="text-[10px] text-zinc-500 block uppercase font-bold">Category</span>
                    <span className="font-semibold text-zinc-200 capitalize">{experience.category}</span>
                  </div>
                  <div className="bg-[#11111a] p-2.5 rounded-xl border border-[#272738]">
                    <span className="text-[10px] text-zinc-500 block uppercase font-bold">Mood</span>
                    <span className="font-semibold text-zinc-200 capitalize">{experience.mood || 'Modern'}</span>
                  </div>
                  <div className="bg-[#11111a] p-2.5 rounded-xl border border-[#272738]">
                    <span className="text-[10px] text-zinc-500 block uppercase font-bold">Motion</span>
                    <span className="font-semibold text-zinc-200 capitalize">{experience.motionLevel || 'Subtle'}</span>
                  </div>
                  <div className="bg-[#11111a] p-2.5 rounded-xl border border-[#272738]">
                    <span className="text-[10px] text-zinc-500 block uppercase font-bold">Source</span>
                    <span className="font-semibold text-zinc-200 capitalize">{experience.source}</span>
                  </div>
                </div>
              </div>

              {/* Asset Slots Detected */}
              {experience.assetSlots && experience.assetSlots.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-violet-400" />
                    <span>Asset Slots ({experience.assetSlots.length})</span>
                  </h4>
                  <div className="space-y-1.5">
                    {experience.assetSlots.map(slot => (
                      <div key={slot.id} className="text-[11px] bg-[#11111a] px-3 py-2 rounded-lg border border-[#252535] flex items-center justify-between text-zinc-300">
                        <span className="font-medium">{slot.label}</span>
                        <span className="text-[10px] font-mono text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">
                          {slot.slotType}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {experience.tags && experience.tags.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {experience.tags.map(tag => (
                      <span key={tag} className="text-[10px] bg-white/[0.06] text-zinc-300 px-2 py-1 rounded-md border border-white/[0.08]">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Primary Action Button & Insertion Dropdown */}
            <div className="pt-6 border-t border-[#272736] space-y-2 mt-6">
              <div className="relative">
                <button
                  onClick={() => handleApply('add')}
                  disabled={insertedSuccess}
                  className="w-full py-3.5 rounded-xl font-extrabold text-xs tracking-wide bg-gradient-to-r from-[#B8893A] to-[#D9A86C] hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-xl shadow-[#D9A86C]-600/30 flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
                >
                  {insertedSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>INSERTED INTO CANVAS!</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-violet-200" />
                      <span>USE THIS EXPERIENCE</span>
                    </>
                  )}
                </button>
              </div>

              {/* Contextual Alternative Insertion Modes */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  onClick={() => handleApply('above')}
                  className="px-2.5 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[11px] font-semibold text-zinc-300 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ArrowUp className="w-3 h-3 text-violet-400" />
                  <span>Insert Above</span>
                </button>
                <button
                  onClick={() => handleApply('below')}
                  className="px-2.5 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[11px] font-semibold text-zinc-300 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ArrowDown className="w-3 h-3 text-violet-400" />
                  <span>Insert Below</span>
                </button>
                {selectedSectionId && (
                  <button
                    onClick={() => handleApply('replace')}
                    className="col-span-2 px-2.5 py-2 rounded-lg bg-violet-950/40 hover:bg-violet-950/70 border border-[#D9A86C]/30 text-[11px] font-semibold text-violet-300 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Replace className="w-3 h-3 text-violet-400" />
                    <span>Replace Selected Section</span>
                  </button>
                )}
                {experience.type === 'website' && (
                  <button
                    onClick={() => {
                      if (confirm('Replace current page with this entire website experience?')) {
                        handleApply('page');
                      }
                    }}
                    className="col-span-2 px-2.5 py-2 rounded-lg bg-fuchsia-950/40 hover:bg-fuchsia-950/70 border border-fuchsia-500/30 text-[11px] font-semibold text-fuchsia-300 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Globe className="w-3 h-3 text-fuchsia-400" />
                    <span>Use as Entire Page</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
