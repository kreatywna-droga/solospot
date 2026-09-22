'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X, Search, Plus, Eye, Star, Sparkles, Filter, RotateCcw,
  LayoutDashboard, Grid, MousePointerClick, Image as ImageIcon,
  Wand2, Layers, BookmarkCheck, Globe, Trash2, Copy, Check,
  ChevronDown, ArrowRight,
} from 'lucide-react';
import { useBuilder } from '../state/BuilderProvider';
import type {
  ExperienceItem,
  ExperienceType,
  ExperienceMood,
  ExperienceMotionLevel,
} from '@/lib/experience/ExperienceTypes';
import {
  searchExperiences,
  isFavorite,
  toggleFavorite,
  deleteUserExperience,
  duplicateUserExperience,
} from '@/lib/experience/ExperienceCatalog';
import {
  EXPERIENCE_CATEGORIES,
  EXPERIENCE_MOODS,
  EXPERIENCE_MOTION_LEVELS,
  EXPERIENCE_INDUSTRIES,
} from '@/lib/experience/ExperienceCategories';
import { SectionPreviewRenderer, ScaleToFitContainer } from '../library/SectionPreviewRenderer';
import { insertExperienceToCanvas, type InsertionContext } from '@/lib/experience/ExperienceInsertionEngine';
import { ExperienceDetailModal } from './ExperienceDetailModal';

export interface ExperienceLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  insertIndex?: number;
  onInserted?: (newSectionId: string) => void;
  initialType?: ExperienceType | 'all';
}

export function ExperienceLibraryModal({
  isOpen,
  onClose,
  insertIndex,
  onInserted,
  initialType = 'all',
}: ExperienceLibraryModalProps) {
  const { document, canvas, dispatch } = useBuilder();

  const [selectedCategory, setSelectedCategory] = useState<string>(initialType);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<ExperienceMood | 'all'>('all');
  const [selectedMotion, setSelectedMotion] = useState<ExperienceMotionLevel | 'all'>('all');
  const [selectedIndustry, setSelectedIndustry] = useState('All');
  const [detailExperience, setDetailExperience] = useState<ExperienceItem | null>(null);
  const [favRefreshKey, setFavRefreshKey] = useState(0);

  const activePageId = canvas.selectedPageId || document.pages[0]?.id;
  const sections = document.pages.find(p => p.id === activePageId)?.sections || [];

  const predecessor = insertIndex !== undefined && insertIndex > 0 ? sections?.[insertIndex - 1]?.label || `Section #${insertIndex}` : null;
  const successor = insertIndex !== undefined && sections && insertIndex < sections.length ? sections?.[insertIndex]?.label || `Section #${insertIndex + 1}` : null;

  // Sync category if initialType changes
  useEffect(() => {
    if (initialType && initialType !== 'all') {
      setSelectedCategory(initialType);
    }
  }, [initialType]);

  // Query catalog
  const filteredExperiences = useMemo(() => {
    return searchExperiences({
      category: selectedCategory,
      mood: selectedMood,
      motionLevel: selectedMotion,
      industry: selectedIndustry,
      searchQuery,
      favoritesOnly: selectedCategory === 'favorites',
    });
  }, [selectedCategory, selectedMood, selectedMotion, selectedIndustry, searchQuery, favRefreshKey]);

  if (!isOpen) return null;

  const handleQuickInsert = (exp: ExperienceItem) => {
    if (!activePageId) return;
    const ctx: InsertionContext = {
      document,
      pageId: activePageId,
      selectedSectionId: canvas.selectedSectionId,
      insertIndex,
      dispatch,
    };

    const mode = exp.type === 'website' ? 'page' : 'add';
    const res = insertExperienceToCanvas(exp, ctx, mode);
    if (res.success && res.insertedNodeId) {
      if (onInserted) onInserted(res.insertedNodeId);
      onClose();
    }
  };

  const handleToggleFav = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    toggleFavorite(id);
    setFavRefreshKey(k => k + 1);
  };

  const handleDeleteUserExp = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this custom experience?')) {
      deleteUserExperience(id);
      setFavRefreshKey(k => k + 1);
    }
  };

  const handleDuplicateUserExp = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    duplicateUserExperience(id);
    setFavRefreshKey(k => k + 1);
  };

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedMood('all');
    setSelectedMotion('all');
    setSelectedIndustry('All');
    setSearchQuery('');
  };

  return (
    <>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-md p-2 md:p-6 animate-in fade-in duration-150 select-none">
        <div
          className="w-full max-w-7xl max-h-[95vh] bg-[#2A2A2F] border border-[#44444B] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#3A3A40] bg-[#252529]">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#D9A86C]/20 border border-[#D9A86C]/30 flex items-center justify-center text-[#F2C27F]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h2 className="text-base md:text-lg font-extrabold text-white flex items-center gap-2">
                  <span>Experience Library</span>
                  <span className="text-xs font-mono font-bold text-[#F2C27F] bg-[#D9A86C]/10 px-2.5 py-0.5 rounded-full border border-[#D9A86C]/20">
                    v2.0
                  </span>
                  <span className="text-xs font-semibold text-zinc-400 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                    {filteredExperiences.length} experiences
                  </span>
                </h2>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                {insertIndex !== undefined ? (
                  <span className="text-[#F2C27F] font-medium">
                    Inserting at position #{insertIndex + 1} {predecessor && successor ? `(between "${predecessor}" and "${successor}")` : predecessor ? `(after "${predecessor}")` : successor ? `(before "${successor}")` : '(start of page)'}.
                  </span>
                ) : (
                  'Browse, live-preview and insert production-grade responsive experiences, heroes, motion stages, and websites.'
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Primary Category Bar */}
          <div className="px-6 py-2.5 border-b border-[#3A3A40] bg-[#252529] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {EXPERIENCE_CATEGORIES.slice(0, 10).map(cat => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#D9A86C] text-white shadow-lg shadow-[#D9A86C]/30 font-bold'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search & Multi-Facet Filters Bar */}
          <div className="p-4 border-b border-[#3A3A40] bg-[#252529] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search experiences by name, keyword, style, industry (e.g. Hero, Bento, Aurora, SaaS)..."
                className="w-full pl-10 pr-4 py-2 bg-[#202024] border border-[#1F1F24] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#D9A86C] transition-colors"
              />
            </div>

            {/* Filter Selectors */}
            <div className="flex items-center gap-2 overflow-x-auto">
              {/* Mood Filter */}
              <select
                value={selectedMood}
                onChange={(e) => setSelectedMood(e.target.value as any)}
                className="bg-[#202024] border border-[#1F1F24] text-xs font-semibold text-zinc-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#D9A86C] cursor-pointer"
              >
                {EXPERIENCE_MOODS.map(m => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>

              {/* Motion Level Filter */}
              <select
                value={selectedMotion}
                onChange={(e) => setSelectedMotion(e.target.value as any)}
                className="bg-[#202024] border border-[#1F1F24] text-xs font-semibold text-zinc-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#D9A86C] cursor-pointer"
              >
                {EXPERIENCE_MOTION_LEVELS.map(m => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>

              {/* Industry Filter */}
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="bg-[#202024] border border-[#1F1F24] text-xs font-semibold text-zinc-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#D9A86C] cursor-pointer"
              >
                {EXPERIENCE_INDUSTRIES.map(i => (
                  <option key={i} value={i}>{i === 'All' ? 'All Industries' : i}</option>
                ))}
              </select>

              {/* Reset Filters */}
              {(selectedMood !== 'all' || selectedMotion !== 'all' || selectedIndustry !== 'All' || searchQuery) && (
                <button
                  onClick={resetFilters}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                  title="Reset all filters"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Cards Grid Content Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#18181B]">
            {filteredExperiences.length === 0 ? (
              <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500">
                  <Filter className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">No Experiences Found</h3>
                <p className="text-xs text-zinc-400 max-w-sm">
                  We could not find any experiences matching your current search and filter settings.
                </p>
                <button
                  onClick={resetFilters}
                  className="mt-2 px-4 py-2 rounded-xl bg-[#D9A86C] hover:bg-[#C99A4A] text-white text-xs font-bold transition-all shadow-md shadow-[#D9A86C]/30"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredExperiences.map(exp => {
                  const isFav = isFavorite(exp.id);
                  const isUser = exp.source === 'user';
                  const node = exp.createNode();

                  return (
                    <div
                      key={exp.id}
                      className="group relative rounded-2xl bg-[#202024] border border-[#1F1F24] hover:border-[#D9A86C]/60 hover:shadow-2xl hover:shadow-[#D9A86C]/30 transition-all duration-200 flex flex-col justify-between overflow-hidden"
                    >
                      {/* Visual-First Live Scale-To-Fit Preview */}
                      <div
                        className="relative w-full cursor-pointer overflow-hidden bg-[#18181B] p-2 group/preview"
                        onClick={() => setDetailExperience(exp)}
                      >
                        {/* Floating Top Badges */}
                        <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
                          <div className="flex items-center gap-1.5 pointer-events-auto">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F2C27F] bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 shadow-sm">
                              {exp.type}
                            </span>
                            {exp.badge && (
                              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-[#D9A86C]/90 text-white shadow-sm">
                                {exp.badge}
                              </span>
                            )}
                            {exp.motionLevel && exp.motionLevel !== 'static' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur-md flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" />
                                <span className="capitalize">{exp.motionLevel}</span>
                              </span>
                            )}
                          </div>

                          <button
                            onClick={(e) => handleToggleFav(e, exp.id)}
                            className={`p-1.5 rounded-lg border transition-colors pointer-events-auto shadow-sm backdrop-blur-md ${
                              isFav
                                ? 'bg-amber-400/30 border-amber-400/50 text-amber-300'
                                : 'bg-black/60 border-white/10 text-zinc-400 hover:text-white'
                            }`}
                            title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                          </button>
                        </div>

                        <ScaleToFitContainer targetWidth={960} maxHeight={380} interactive={false}>
                          <SectionPreviewRenderer
                            sectionNode={node}
                            isPlaying={true}
                            isInteractive={false}
                            runtimeConfig={exp.runtimeConfig}
                          />
                        </ScaleToFitContainer>

                        {/* Hover Overlay with Action Buttons */}
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-[3px] opacity-0 group-hover/preview:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2.5 p-4 z-20">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickInsert(exp);
                            }}
                            className="px-4 py-2.5 rounded-xl bg-[#D9A86C] hover:bg-[#C99A4A] text-white text-xs font-extrabold shadow-xl shadow-[#D9A86C]/40 flex items-center gap-1.5 transition-transform active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>USE EXPERIENCE</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailExperience(exp);
                            }}
                            className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 flex items-center gap-1.5 transition-all"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#F2C27F]" />
                            <span>PREVIEW</span>
                          </button>
                        </div>
                      </div>

                      {/* Card Meta Footer */}
                      <div className="p-4 bg-[#252529] border-t border-[#3A3A40] flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3
                              onClick={() => setDetailExperience(exp)}
                              className="text-sm font-bold text-white group-hover:text-[#F2C27F] transition-colors truncate cursor-pointer"
                            >
                              {exp.name}
                            </h3>
                            <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">
                              {exp.tagline || exp.description}
                            </p>
                          </div>
                          {exp.mood && (
                            <span className="text-[10px] text-zinc-400 capitalize bg-white/5 px-2 py-0.5 rounded border border-white/5 flex-shrink-0">
                              {exp.mood}
                            </span>
                          )}
                        </div>

                        {/* Action Buttons Row */}
                        <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-medium">
                            <span className="capitalize">{exp.category}</span>
                            {exp.assetSlots && exp.assetSlots.length > 0 && (
                              <>
                                <span>•</span>
                                <span>{exp.assetSlots.length} assets</span>
                              </>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {isUser && (
                              <>
                                <button
                                  onClick={(e) => handleDuplicateUserExp(e, exp.id)}
                                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
                                  title="Duplicate custom experience"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => handleDeleteUserExp(e, exp.id)}
                                  className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                  title="Delete custom experience"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => setDetailExperience(exp)}
                              className="text-xs text-zinc-300 hover:text-white font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-white/10 border border-white/10 transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Details</span>
                            </button>
                            <button
                              onClick={() => handleQuickInsert(exp)}
                              className="text-xs font-extrabold text-white flex items-center gap-1 bg-[#D9A86C] hover:bg-[#C99A4A] px-3 py-1 rounded-lg shadow-sm shadow-[#D9A86C]/30 transition-all active:scale-95"
                            >
                              <span>Use</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Experience Live Preview Detail Modal */}
      {detailExperience && (
        <ExperienceDetailModal
          isOpen={Boolean(detailExperience)}
          onClose={() => setDetailExperience(null)}
          experience={detailExperience}
          insertIndex={insertIndex}
          onInserted={onInserted}
        />
      )}
    </>
  );
}
