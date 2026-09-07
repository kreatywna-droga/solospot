'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  X, Search, Plus, LayoutDashboard, UserCheck, Star, Sparkles,
  CreditCard, HelpCircle, ArrowRight, Mail, Compass, Grid, Layers,
  ChevronRight, ChevronLeft, Eye, Monitor, Tablet, Smartphone,
  ChevronDown, LayoutGrid, List, Images, BarChart3, Briefcase,
  Newspaper, Bookmark, Navigation, ShoppingBag,
} from 'lucide-react';
import { useBuilder } from '../state/BuilderProvider';
import { SectionPreviewRenderer, ScaleToFitContainer } from './SectionPreviewRenderer';
import {
  BuilderNode,
  SectionNode,
  NAVIGABLE_CATEGORY_MAP,
} from '../../../../packages/builder-core/src';

import type { SectionCategory, SectionTemplateItem } from './SectionTemplatesData';
import { SECTION_TEMPLATES } from './SectionTemplatesData';
export type { SectionCategory, SectionTemplateItem };
export { SECTION_TEMPLATES };


export const CATEGORIES: { id: SectionCategory; label: string; icon: React.ElementType }[] = [
  { id: 'all', label: 'All', icon: Grid },
  { id: 'hero', label: 'Hero', icon: LayoutDashboard },
  { id: 'features', label: 'Features', icon: Sparkles },
  { id: 'services', label: 'Services', icon: Compass },
  { id: 'products', label: 'Products', icon: ShoppingBag },
  { id: 'about', label: 'About', icon: UserCheck },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'testimonials', label: 'Testimonials', icon: Star },
  { id: 'pricing', label: 'Pricing', icon: CreditCard },
  { id: 'cta', label: 'CTA', icon: ArrowRight },
  { id: 'logos', label: 'Logos', icon: Briefcase },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
  { id: 'gallery', label: 'Gallery', icon: Images },
  { id: 'portfolio', label: 'Portfolio', icon: Eye },
  { id: 'faq', label: 'FAQ', icon: HelpCircle },
  { id: 'contact', label: 'Contact', icon: Mail },
  { id: 'blog', label: 'Blog', icon: Newspaper },
  { id: 'newsletter', label: 'Newsletter', icon: Bookmark },
  { id: 'navigation', label: 'Navigation', icon: Navigation },
  { id: 'footer', label: 'Footer', icon: Layers },
];

// Users icon component (not in lucide imports above)
function Users({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

const STYLE_OPTIONS = [
  'All', 'Modern', 'Minimal', 'Bold', 'Dark', 'Light', 'Luxury', 'Editorial',
  'Creative', 'Corporate', 'Premium', 'Elegant', 'Organic', 'Cinematic',
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
  const [selectedStyle, setSelectedStyle] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'accordion'>('grid');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [previewModalTemplate, setPreviewModalTemplate] = useState<SectionTemplateItem | null>(null);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const predecessor = insertIndex !== undefined && insertIndex > 0 ? sections?.[insertIndex - 1]?.label || `Section #${insertIndex}` : null;
  const successor = insertIndex !== undefined && sections && insertIndex < sections.length ? sections?.[insertIndex]?.label || `Section #${insertIndex + 1}` : null;

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
        (item.badge && item.badge.toLowerCase().includes(q)) ||
        (item.tags && item.tags.some(t => t.toLowerCase().includes(q))) ||
        (item.industry && item.industry.some(i => i.toLowerCase().includes(q)));
      const matchStyle = selectedStyle === 'All' || item.style?.toLowerCase() === selectedStyle.toLowerCase();
      return matchCat && matchQuery && matchStyle;
    });
  }, [selectedCategory, searchQuery, selectedStyle]);

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
        {/* Card Header */}
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
              <span>INSERT SECTION</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPreviewModalTemplate(template);
              }}
              className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/25 flex items-center gap-2 transition-all"
            >
              <Eye className="w-4 h-4 text-violet-300" />
              <span>ENLARGE PREVIEW</span>
            </button>
          </div>
        </div>

        {/* Card Footer */}
        <div className="px-5 py-4 bg-[#16161c] border-t border-[#22222a] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold text-violet-400 uppercase tracking-wider bg-violet-500/10 px-2.5 py-1 rounded-md border border-violet-500/20">
              {template.category}
            </span>
            {template.style && (
              <span className="text-[10px] font-medium text-zinc-500 px-2 py-0.5 rounded bg-white/5">
                {template.style}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setPreviewModalTemplate(template)}
              className="text-xs text-zinc-300 hover:text-white font-semibold flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10 border border-white/10"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Expand</span>
            </button>
            <button
              onClick={() => handleSelectTemplate(template)}
              className="text-xs font-extrabold text-white flex items-center gap-1.5 transition-all bg-violet-600 hover:bg-violet-500 px-4 py-1.5 rounded-lg shadow-md shadow-violet-600/30"
            >
              <span>Insert</span>
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
                <span>Visual Section Library</span>
                <span className="text-xs font-semibold text-zinc-300 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15">
                  {SECTION_TEMPLATES.length} ready-made layouts
                </span>
                {insertIndex !== undefined && (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-violet-500/20 text-[#A78BFA] font-bold border border-violet-500/30">
                    Inserting at position #{insertIndex + 1}
                  </span>
                )}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {insertIndex !== undefined ? (
                  <span className="text-[#A78BFA] font-medium">
                    New section will be inserted {predecessor && successor ? `between "${predecessor}" and "${successor}"` : predecessor ? `after "${predecessor}"` : successor ? `before "${successor}"` : 'at the beginning of the page'}.
                  </span>
                ) : (
                  'Choose from ready-made layouts with full appearance, typography, and action elements preserved.'
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

          {/* Search, Filters & View Switcher Bar */}
          <div className="p-4 border-b border-[#27272A] bg-[#18181e] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sections by name, category, tag, or use case (e.g. Hero, Pricing, Restaurant, E-commerce)..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#22222a] border border-[#3F3F46]/50 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <div className="relative flex-shrink-0">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as SectionCategory)}
                  className="appearance-none bg-[#22222a] hover:bg-[#2B2B36] border border-violet-500/40 text-xs font-bold text-violet-300 rounded-xl px-4 py-2.5 pr-8 focus:outline-none focus:border-violet-500 cursor-pointer transition-colors"
                >
                  <option value="all">All Categories ({SECTION_TEMPLATES.length})</option>
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

              <div className="relative flex-shrink-0">
                <select
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value)}
                  className="appearance-none bg-[#22222a] hover:bg-[#2B2B36] border border-violet-500/40 text-xs font-bold text-violet-300 rounded-xl px-4 py-2.5 pr-8 focus:outline-none focus:border-violet-500 cursor-pointer transition-colors"
                >
                  {STYLE_OPTIONS.map(s => (
                    <option key={s} value={s}>{s === 'All' ? 'All Styles' : s}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-violet-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center bg-[#22222a] p-1 rounded-xl border border-[#3F3F46]/40">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'grid' ? 'bg-violet-600 text-white shadow' : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Large card view"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Grid</span>
                </button>
                <button
                  onClick={() => setViewMode('accordion')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'accordion' ? 'bg-violet-600 text-white shadow' : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Expandable categories"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Accordion</span>
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
                <p className="text-lg font-bold text-zinc-300">No sections found</p>
                <p className="text-xs text-zinc-400 max-w-md">
                  Try changing the search phrase or selecting a different category.
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
                            {group.items.length} {group.items.length === 1 ? 'section' : 'sections'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
                          <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
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
              /* Large Grid View */
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
                {([
                  ['desktop', Monitor, 'Desktop (1280px)'],
                  ['tablet', Tablet, 'Tablet (768px)'],
                  ['mobile', Smartphone, 'Mobile (375px)'],
                ] as const).map(([vp, Icon, label]) => (
                  <button
                    key={vp}
                    onClick={() => setPreviewViewport(vp)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      previewViewport === vp ? 'bg-violet-600 text-white shadow font-bold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </button>
                ))}
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
                {previewModalTemplate.style && (
                  <>
                    <span>·</span>
                    <span>{previewModalTemplate.style}</span>
                  </>
                )}
                <span>·</span>
                <span>Real layout & styling in SoloSpot Canvas</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPreviewModalTemplate(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold transition-colors"
                >
                  Close preview
                </button>
                <button
                  onClick={() => {
                    handleSelectTemplate(previewModalTemplate);
                    setPreviewModalTemplate(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 flex items-center gap-2 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Insert this section</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
