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
          className="w-full max-w-7xl max-h-[95vh] bg-[#14141c] border border-[#272736] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#252535] bg-[#191924]">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h2 className="text-base md:text-lg font-extrabold text-white flex items-center gap-2">
                  <span>Experience Library</span>
                  <span className="text-xs font-mono font-bold text-violet-400 bg-violet-500/10 px-2.5 py-0.5 rounded-full border border-violet-500/20">
                    v2.0
                  </span>
                  <span className="text-xs font-semibold text-zinc-400 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                    {filteredExperiences.length} experiences
                  </span>
                </h2>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                {insertIndex !== undefined ? (
                  <span className="text-violet-300 font-medium">
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
          <div className="px-6 py-2.5 border-b border-[#222230] bg-[#161622] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {EXPERIENCE_CATEGORIES.slice(0, 10).map(cat => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30 font-bold'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search & Multi-Facet Filters Bar */}
          <div className="p-4 border-b border-[#222230] bg-[#13131c] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search experiences by name, keyword, style, industry (e.g. Hero, Bento, Aurora, SaaS)..."
                className="w-full pl-10 pr-4 py-2 bg-[#1b1b26] border border-[#2d2d3e] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            {/* Filter Selectors */}
            <div className="flex items-center gap-2 overflow-x-auto">
              {/* Mood Filter */}
              <select
                value={selectedMood}
                onChange={(e) => setSelectedMood(e.target.value as any)}
                className="bg-[#1b1b26] border border-[#2d2d3e] text-xs font-semibold text-zinc-300 rounded-xl px-3 py-2 focus:outline-none focus:border-violet-500 cursor-pointer"
              >
                {EXPERIENCE_MOODS.map(m => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>

              {/* Motion Level Filter */}
              <select
                value={selectedMotion}
                onChange={(e) => setSelectedMotion(e.target.value as any)}
                className="bg-[#1b1b26] border border-[#2d2d3e] text-xs font-semibold text-zinc-300 rounded-xl px-3 py-2 focus:outline-none focus:border-violet-500 cursor-pointer"
              >
                {EXPERIENCE_MOTION_LEVELS.map(m => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>

              {/* Industry Filter */}
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="bg-[#1b1b26] border border-[#2d2d3e] text-xs font-semibold text-zinc-300 rounded-xl px-3 py-2 focus:outline-none focus:border-violet-500 cursor-pointer"
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
          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#0c0c14]">
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
                  className="mt-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-md shadow-violet-600/30"
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
                      className="group relative rounded-2xl bg-[#14141d] border border-[#232332] hover:border-violet-500/60 hover:shadow-2xl hover:shadow-violet-950/30 transition-all duration-200 flex flex-col justify-between overflow-hidden"
                    >
                      {/* Card Header */}
                      <div className="p-4 pb-3 flex items-start justify-between gap-3 border-b border-[#1f1f2c] bg-[#181822]">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-extrabold text-white group-hover:text-violet-300 transition-colors truncate">
                              {exp.name}
                            </h3>
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2">
                            {exp.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={(e) => handleToggleFav(e, exp.id)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isFav
                                ? 'bg-amber-400/20 border-amber-400/40 text-amber-300'
                                : 'bg-white/5 border-white/10 text-zinc-500 hover:text-white'
                            }`}
                            title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                          </button>
                          {exp.badge && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/40">
                              {exp.badge}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Live Scale-To-Fit Preview */}
                      <div
                        className="relative w-full cursor-pointer overflow-hidden bg-[#07070e] p-2.5 group/preview"
                        onClick={() => setDetailExperience(exp)}
                      >
                        <ScaleToFitContainer targetWidth={960} maxHeight={280}>
                          <SectionPreviewRenderer sectionNode={node} />
                        </ScaleToFitContainer>

                        {/* Hover Overlay with Action Buttons */}
                        <div className="absolute inset-0 bg-black/75 backdrop-blur-[3px] opacity-0 group-hover/preview:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2.5 p-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickInsert(exp);
                            }}
                            className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-extrabold shadow-xl shadow-violet-600/40 flex items-center gap-1.5 transition-transform active:scale-95"
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
                            <Eye className="w-3.5 h-3.5 text-violet-300" />
                            <span>PREVIEW</span>
                          </button>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="px-4 py-3 bg-[#161620] border-t border-[#1f1f2c] flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[10px] font-mono font-bold text-violet-400 uppercase tracking-wider bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20 truncate">
                            {exp.type}
                          </span>
                          {exp.mood && (
                            <span className="text-[10px] text-zinc-400 capitalize truncate">
                              {exp.mood}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
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
                            className="text-xs font-extrabold text-white flex items-center gap-1 bg-violet-600 hover:bg-violet-500 px-3 py-1 rounded-lg shadow-sm shadow-violet-600/30 transition-all active:scale-95"
                          >
                            <span>Insert</span>
                          </button>
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
