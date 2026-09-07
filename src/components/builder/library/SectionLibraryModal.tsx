'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  X, Search, Plus, LayoutDashboard, UserCheck, Star, Sparkles,
  CreditCard, HelpCircle, ArrowRight, Mail, Compass, Grid, Layers,
  ChevronRight, ChevronLeft, CheckCircle2, Eye, Monitor, Tablet, Smartphone,
  ChevronDown, ListFilter, SlidersHorizontal, Layers3, LayoutGrid, List,
} from 'lucide-react';
import { useBuilder } from '../state/BuilderProvider';
import { SectionPreviewRenderer, ScaleToFitContainer } from './SectionPreviewRenderer';
import {
  BuilderNode,
  SectionNode,
  createBuilderNode,
  createSectionNode,
  generateNodeId,
  NAVIGABLE_CATEGORY_MAP,
} from '../../../../packages/builder-core/src';

import type { SectionCategory, SectionTemplateItem } from './SectionTemplatesData';
import { SECTION_TEMPLATES } from './SectionTemplatesData';
export type { SectionCategory, SectionTemplateItem };
export { SECTION_TEMPLATES };


export const CATEGORIES: { id: SectionCategory; label: string; icon: React.ElementType }[] = [
  { id: 'all', label: 'Wszystkie', icon: Grid },
  { id: 'hero', label: 'Hero Banners', icon: LayoutDashboard },
  { id: 'about', label: 'O Nas', icon: UserCheck },
  { id: 'features', label: 'Cechy & Zalety', icon: Sparkles },
  { id: 'services', label: 'Usługi', icon: Compass },
  { id: 'gallery', label: 'Galeria', icon: Grid },
  { id: 'testimonials', label: 'Opinie', icon: Star },
  { id: 'pricing', label: 'Cennik', icon: CreditCard },
  { id: 'faq', label: 'Pytania FAQ', icon: HelpCircle },
  { id: 'cta', label: 'Wezwanie CTA', icon: ArrowRight },
  { id: 'contact', label: 'Kontakt', icon: Mail },
  { id: 'footer', label: 'Stopka', icon: Layers },
];

export interface SectionLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  insertIndex?: number;
  sections?: SectionNode[];
  onInserted?: (newSectionId: string) => void;
}

export function SectionLibraryModal({ isOpen, onClose, insertIndex, sections, onInserted }: SectionLibraryModalProps) {
  const { dispatch, canvas, document: builderDoc } = useBuilder();
  const [selectedCategory, setSelectedCategory] = useState<SectionCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'accordion'>('grid');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    hero: true,
    about: true,
    features: true,
    services: true,
    gallery: true,
    testimonials: true,
    pricing: true,
    faq: true,
    cta: true,
    contact: true,
    footer: true,
  });
  const [previewModalTemplate, setPreviewModalTemplate] = useState<SectionTemplateItem | null>(null);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const predecessor = insertIndex !== undefined && insertIndex > 0 ? sections?.[insertIndex - 1]?.label || `Sekcja #${insertIndex}` : null;
  const successor = insertIndex !== undefined && sections && insertIndex < sections.length ? sections?.[insertIndex]?.label || `Sekcja #${insertIndex + 1}` : null;

  // Cache template nodes so tree creation runs once per template
  const templateNodes = useMemo(() => {
    const map = new Map<string, BuilderNode>();
    SECTION_TEMPLATES.forEach(t => {
      map.set(t.id, t.createNode());
    });
    return map;
  }, []);

  const getTemplateNode = (template: SectionTemplateItem): BuilderNode => {
    return templateNodes.get(template.id) || template.createNode();
  };

  const filteredTemplates = useMemo(() => {
    return SECTION_TEMPLATES.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.badge && item.badge.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  // Group templates by category for Accordion View
  const groupedCategories = useMemo(() => {
    const activeCats = CATEGORIES.filter(c => c.id !== 'all');
    return activeCats.map(cat => {
      const items = filteredTemplates.filter(t => t.category === cat.id);
      return {
        ...cat,
        items,
      };
    }).filter(g => g.items.length > 0);
  }, [filteredTemplates]);

  const toggleCategoryExpand = (catId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!isOpen) return null;

  const handleSelectTemplate = (template: SectionTemplateItem) => {
    const targetPageId = canvas.selectedPageId || builderDoc.pages[0]?.id;
    if (!targetPageId) return;

    const newSectionNode = template.createNode();
    const navInfo = NAVIGABLE_CATEGORY_MAP[template.category];

    if (navInfo) {
      const cleanAnchor = navInfo.anchor.replace('#', '');
      newSectionNode.props = {
        ...newSectionNode.props,
        anchorId: cleanAnchor,
      };
      newSectionNode.metadata = {
        ...newSectionNode.metadata,
        anchorId: cleanAnchor,
        category: template.category,
      };

      const activePage = builderDoc.pages.find(p => p.id === targetPageId) || builderDoc.pages[0];
      const sectionsList = activePage?.sections || [];
      const navbarSection = sectionsList.find(s =>
        s.type === 'navbar' ||
        s.label.toLowerCase().includes('nawigacja') ||
        s.label.toLowerCase().includes('menu') ||
        s.label.toLowerCase().includes('header')
      );

      if (navbarSection) {
        const existingLinks = ((navbarSection.props?.links as Array<{ label: string; href: string }>) || []);
        const alreadyExists = existingLinks.some(
          l => l.href === navInfo.anchor || l.label.toLowerCase() === navInfo.label.toLowerCase()
        );
        if (!alreadyExists) {
          dispatch({
            type: 'UPDATE_NODE',
            nodeId: navbarSection.id,
            updates: {
              props: {
                ...navbarSection.props,
                links: [...existingLinks, { label: navInfo.label, href: navInfo.anchor }],
              },
            },
            pageId: targetPageId,
          });
        }
      }
    }

    dispatch({
      type: 'INSERT_NODE',
      parentId: null,
      node: newSectionNode,
      index: insertIndex !== undefined ? insertIndex : undefined,
      pageId: targetPageId,
    });

    dispatch({
      type: 'CANVAS',
      action: { type: 'SELECT_SECTION', sectionId: newSectionNode.id },
    });

    if (onInserted) {
      onInserted(newSectionNode.id);
    }

    onClose();
  };

  const renderSectionCard = (template: SectionTemplateItem) => {
    const node = getTemplateNode(template);
    return (
      <div
        key={template.id}
        className="group relative rounded-2xl bg-[#14141a] border border-[#272730] hover:border-violet-500/70 hover:shadow-2xl hover:shadow-violet-950/30 transition-all duration-200 flex flex-col justify-between overflow-hidden"
      >
        {/* Card Header — Large & Readable */}
        <div className="p-5 pb-4 flex items-start justify-between gap-3 border-b border-[#22222a] bg-[#1a1a22]">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-sm font-extrabold text-white group-hover:text-violet-300 transition-colors">
                {template.name}
              </h3>
            </div>
            <p className="text-xs text-zinc-300 mt-1 line-clamp-2">
              {template.description}
            </p>
          </div>
          {template.badge && (
            <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/40 whitespace-nowrap">
              {template.badge}
            </span>
          )}
        </div>

        {/* Large Scale-To-Fit Visual Preview Area */}
        <div
          className="relative w-full cursor-pointer overflow-hidden group/preview bg-[#090910] p-3"
          onClick={() => setPreviewModalTemplate(template)}
        >
          <ScaleToFitContainer targetWidth={960} maxHeight={340}>
            <SectionPreviewRenderer sectionNode={node} />
          </ScaleToFitContainer>

          {/* Hover Overlay with Large Action Triggers */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3 p-6">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSelectTemplate(template);
              }}
              className="px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-extrabold shadow-xl shadow-violet-600/50 flex items-center gap-2 transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>WSTAW TĘ SEKCJĘ</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPreviewModalTemplate(template);
              }}
              className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/25 flex items-center gap-2 transition-all"
            >
              <Eye className="w-4 h-4 text-violet-300" />
              <span>POWIĘKSZ PODGLĄD</span>
            </button>
          </div>
        </div>

        {/* Card Footer */}
        <div className="px-5 py-4 bg-[#16161c] border-t border-[#22222a] flex items-center justify-between gap-3">
          <span className="text-[11px] font-mono font-bold text-violet-400 uppercase tracking-wider bg-violet-500/10 px-2.5 py-1 rounded-md border border-violet-500/20">
            {template.category}
          </span>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setPreviewModalTemplate(template)}
              className="text-xs text-zinc-300 hover:text-white font-semibold flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10 border border-white/10"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Powiększ</span>
            </button>
            <button
              onClick={() => handleSelectTemplate(template)}
              className="text-xs font-extrabold text-white flex items-center gap-1.5 transition-all bg-violet-600 hover:bg-violet-500 px-4 py-1.5 rounded-lg shadow-md shadow-violet-600/30"
            >
              <span>Wstaw sekcję</span>
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 md:p-6 animate-in fade-in duration-150 select-none">
        <div
          className="w-full max-w-7xl max-h-[94vh] bg-[#1a1a20] border border-[#2D2D32] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272A] bg-[#141418]">
            <div>
              <h2 className="text-base md:text-lg font-extrabold text-white flex items-center gap-2.5">
                <LayoutDashboard className="w-5 h-5 text-[#A78BFA]" />
                <span>Wizualna Biblioteka Sekcji</span>
                <span className="text-xs font-semibold text-zinc-300 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15">
                  {SECTION_TEMPLATES.length} gotowych układów
                </span>
                {insertIndex !== undefined && (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-violet-500/20 text-[#A78BFA] font-bold border border-violet-500/30">
                    Wstawianie na pozycji #{insertIndex + 1}
                  </span>
                )}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {insertIndex !== undefined ? (
                  <span className="text-[#A78BFA] font-medium">
                    Nowa sekcja zostanie wstawiona {predecessor && successor ? `pomiędzy "${predecessor}" a "${successor}"` : predecessor ? `po sekcji "${predecessor}"` : successor ? `przed sekcją "${successor}"` : 'na początku strony'}.
                  </span>
                ) : (
                  'Wybierz z gotowych układów z zachowaniem pełnego wyglądu, typografii i elementów akcji.'
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

          {/* Search, Category Select & View Switcher Bar */}
          <div className="p-4 border-b border-[#27272A] bg-[#18181e] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Szukaj sekcji po nazwie, typie lub przeznaczeniu (np. Hero, Produkty, Cennik, Opinie)..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#22222a] border border-[#3F3F46]/50 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            {/* Rozwijane Menu Kategorii (Dropdown Select) */}
            <div className="flex items-center gap-2">
              <div className="relative flex-shrink-0">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as SectionCategory)}
                  className="appearance-none bg-[#22222a] hover:bg-[#2B2B36] border border-violet-500/40 text-xs font-bold text-violet-300 rounded-xl px-4 py-2.5 pr-8 focus:outline-none focus:border-violet-500 cursor-pointer transition-colors"
                >
                  <option value="all">Rozwijane kategorie — Wszystkie ({SECTION_TEMPLATES.length})</option>
                  {CATEGORIES.filter(c => c.id !== 'all').map(cat => {
                    const count = SECTION_TEMPLATES.filter(t => t.category === cat.id).length;
                    return (
                      <option key={cat.id} value={cat.id}>
                        {cat.label} ({count})
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="w-4 h-4 text-violet-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* View Mode Switcher (Large Grid vs Accordion) */}
              <div className="flex items-center bg-[#22222a] p-1 rounded-xl border border-[#3F3F46]/40">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'grid' ? 'bg-violet-600 text-white shadow' : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Widok dużych kart"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Siatka</span>
                </button>
                <button
                  onClick={() => setViewMode('accordion')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'accordion' ? 'bg-violet-600 text-white shadow' : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Rozwijane kategorie"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Rozwijane</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Category Scroll Pills Bar */}
          <div className="px-4 py-2 bg-[#141418] border-b border-[#24242c] flex items-center">
            <button
              onClick={() => scrollCategories('left')}
              className="p-1 rounded-lg bg-[#22222a] hover:bg-[#2D2D32] border border-[#3F3F46]/40 text-zinc-400 hover:text-white mr-1.5 flex-shrink-0 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div
              ref={categoryScrollRef}
              className="flex items-center gap-1.5 overflow-x-auto scroll-smooth py-1 px-1 scrollbar-none flex-1"
            >
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30 border border-violet-400 font-bold'
                        : 'bg-[#22222a] text-zinc-400 hover:text-white hover:bg-[#2B2B36] border border-[#3F3F46]/30'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => scrollCategories('right')}
              className="p-1 rounded-lg bg-[#22222a] hover:bg-[#2D2D32] border border-[#3F3F46]/40 text-zinc-400 hover:text-white ml-1.5 flex-shrink-0 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-[#111116]">
            {filteredTemplates.length === 0 ? (
              <div className="py-24 flex flex-col items-center justify-center text-zinc-500 text-center gap-3">
                <LayoutDashboard className="w-14 h-14 text-slate-600" />
                <p className="text-lg font-bold text-zinc-300">Nie znaleziono sekcji</p>
                <p className="text-xs text-zinc-400 max-w-md">
                  Spróbuj zmienić frazę wyszukiwania lub wybierz inną kategorię z rozwijanego menu powyżej.
                </p>
              </div>
            ) : viewMode === 'accordion' ? (
              /* Expandable Accordion View */
              <div className="flex flex-col gap-6">
                {groupedCategories.map((group) => {
                  const isExpanded = expandedCategories[group.id] !== false;
                  return (
                    <div key={group.id} className="border border-[#272730] rounded-2xl bg-[#16161e] overflow-hidden shadow-lg">
                      <button
                        onClick={() => toggleCategoryExpand(group.id)}
                        className="w-full px-6 py-4 flex items-center justify-between bg-[#1f1f28] hover:bg-[#262632] transition-colors border-b border-[#282834]"
                      >
                        <div className="flex items-center gap-3">
                          <group.icon className="w-5 h-5 text-violet-400" />
                          <span className="text-base font-extrabold text-white">{group.label}</span>
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                            {group.items.length} {group.items.length === 1 ? 'sekcja' : 'sekcje'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
                          <span>{isExpanded ? 'Zwiń' : 'Rozwiń'}</span>
                          <ChevronDown className={`w-4 h-4 text-violet-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-6 bg-[#111116]">
                          {group.items.map(template => renderSectionCard(template))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Large Grid View (1 or 2 Columns) */
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {filteredTemplates.map((template) => renderSectionCard(template))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Large Detailed Preview Modal */}
      {previewModalTemplate && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-6xl max-h-[92vh] bg-[#141418] border border-[#27272A] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272A] bg-[#1a1a20]">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">{previewModalTemplate.name}</h2>
                  {previewModalTemplate.badge && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                      {previewModalTemplate.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">{previewModalTemplate.description}</p>
              </div>

              {/* Viewport Switcher */}
              <div className="flex items-center gap-1 bg-[#0e0e14] p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setPreviewViewport('desktop')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    previewViewport === 'desktop' ? 'bg-violet-600 text-white shadow font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Desktop (1280px)</span>
                </button>
                <button
                  onClick={() => setPreviewViewport('tablet')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    previewViewport === 'tablet' ? 'bg-violet-600 text-white shadow font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Tablet className="w-3.5 h-3.5" />
                  <span>Tablet (768px)</span>
                </button>
                <button
                  onClick={() => setPreviewViewport('mobile')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    previewViewport === 'mobile' ? 'bg-violet-600 text-white shadow font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile (375px)</span>
                </button>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setPreviewModalTemplate(null)}
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Large Live Section Preview */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#090910] flex items-center justify-center min-h-[420px]">
              <ScaleToFitContainer
                targetWidth={previewViewport === 'desktop' ? 1280 : previewViewport === 'tablet' ? 768 : 375}
                maxHeight={560}
                className="shadow-2xl border border-white/10"
                interactiveVideo={true}
              >
                <SectionPreviewRenderer sectionNode={getTemplateNode(previewModalTemplate)} />
              </ScaleToFitContainer>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#27272A] bg-[#1a1a20]">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="font-mono text-violet-400 uppercase font-semibold">{previewModalTemplate.category}</span>
                <span>•</span>
                <span>Rzeczywisty układ i stylowanie SoloSpot Canvas</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPreviewModalTemplate(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold transition-colors"
                >
                  Zamknij podgląd
                </button>
                <button
                  onClick={() => {
                    handleSelectTemplate(previewModalTemplate);
                    setPreviewModalTemplate(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 flex items-center gap-2 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Wstaw tę sekcję do strony</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
