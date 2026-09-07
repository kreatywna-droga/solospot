'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  X, Search, Sparkles, ArrowRight, Eye, Monitor, Tablet, Smartphone,
  ChevronDown, LayoutGrid, List, CheckCircle2,
} from 'lucide-react';
import { useBuilder } from '../state/BuilderProvider';
import { SECTION_TEMPLATES, SectionTemplateItem } from '../library/SectionTemplatesData';
import { SectionPreviewRenderer, ScaleToFitContainer } from '../library/SectionPreviewRenderer';
import { SectionNode } from '../../../../packages/builder-core/src/BuilderDocument';

import { WEBSITE_TEMPLATES as WEBSITE_TEMPLATES_DATA, WebsiteTemplate as WebsiteTemplateDataType } from './WebsiteTemplatesData';

export type WebsiteTemplate = WebsiteTemplateDataType;

export const WEBSITE_TEMPLATES: WebsiteTemplate[] = WEBSITE_TEMPLATES_DATA;

export interface WebsiteTemplatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STYLE_OPTIONS = [
  'All', 'Modern', 'Minimal', 'Bold', 'Dark', 'Light', 'Luxury', 'Editorial',
  'Creative', 'Corporate', 'Premium', 'Elegant', 'Organic', 'Cinematic',
];

const INDUSTRY_OPTIONS = [
  'All', 'SaaS', 'Startup', 'Technology', 'E-Commerce', 'Fashion', 'Restaurant',
  'Agency', 'Consulting', 'Real Estate', 'Photography', 'Creative', 'Fitness',
  'Education', 'Events', 'Music', 'Law', 'Construction', 'Automotive',
];

export function WebsiteTemplatePickerModal({ isOpen, onClose }: WebsiteTemplatePickerModalProps) {
  const { dispatch, canvas, document: builderDoc } = useBuilder();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('All');
  const [selectedIndustry, setSelectedIndustry] = useState('All');
  const [previewTemplate, setPreviewTemplate] = useState<WebsiteTemplate | null>(null);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Cache section nodes for previews
  const sectionNodeCache = useMemo(() => {
    const map = new Map<string, any>();
    SECTION_TEMPLATES.forEach(t => {
      map.set(t.id, t.createNode());
    });
    return map;
  }, []);

  const getSectionNodes = (template: WebsiteTemplate) => {
    return template.sectionTemplateIds
      .map(id => sectionNodeCache.get(id))
      .filter(Boolean);
  };

  const filteredTemplates = useMemo(() => {
    return WEBSITE_TEMPLATES.filter(t => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        t.name.toLowerCase().includes(q) ||
        t.tagline.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.tags && t.tags.some(tag => tag.toLowerCase().includes(q)));
      const matchStyle = selectedStyle === 'All' || t.style?.toLowerCase() === selectedStyle.toLowerCase();
      const matchIndustry = selectedIndustry === 'All' || (t.industry && t.industry.some(i => i.toLowerCase() === selectedIndustry.toLowerCase()));
      return matchSearch && matchStyle && matchIndustry;
    });
  }, [searchQuery, selectedStyle, selectedIndustry]);

  const handleApplyTemplate = (template: WebsiteTemplate) => {
    const targetPageId = canvas.selectedPageId || builderDoc.pages[0]?.id;
    if (!targetPageId) return;

    if (template.id === 'blank') {
      const activePage = builderDoc.pages.find((p) => p.id === targetPageId);
      if (activePage) {
        activePage.sections.forEach((sec) => {
          dispatch({ type: 'REMOVE_SECTION', pageId: targetPageId, sectionId: sec.id });
        });
      }
      onClose();
      return;
    }

    const sectionsToInsert: SectionNode[] = [];
    template.sectionTemplateIds.forEach((templateId) => {
      const found = SECTION_TEMPLATES.find((t) => t.id === templateId);
      if (found) {
        sectionsToInsert.push(found.createNode() as SectionNode);
      }
    });

    const activePage = builderDoc.pages.find((p) => p.id === targetPageId);
    if (activePage) {
      activePage.sections.forEach((sec) => {
        dispatch({ type: 'REMOVE_SECTION', pageId: targetPageId, sectionId: sec.id });
      });
    }

    sectionsToInsert.forEach((sec, idx) => {
      dispatch({
        type: 'INSERT_NODE',
        parentId: null,
        node: sec,
        index: idx,
        pageId: targetPageId,
      });
    });

    if (sectionsToInsert[0]) {
      dispatch({
        type: 'CANVAS',
        action: { type: 'SELECT_SECTION', sectionId: sectionsToInsert[0].id },
      });
    }

    onClose();
  };

  if (!isOpen) return null;

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
                <Sparkles className="w-5 h-5 text-[#A78BFA]" />
                <span>Website Template Library</span>
                <span className="text-xs font-semibold text-zinc-300 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15">
                  {filteredTemplates.length} templates
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Choose a professionally designed starting point. Every template inserts as real, editable Builder sections.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filters Bar */}
          <div className="p-4 border-b border-[#27272A] bg-[#18181e] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates by name, tag, industry..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#22222a] border border-[#3F3F46]/50 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
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
              <div className="relative flex-shrink-0">
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="appearance-none bg-[#22222a] hover:bg-[#2B2B36] border border-violet-500/40 text-xs font-bold text-violet-300 rounded-xl px-4 py-2.5 pr-8 focus:outline-none focus:border-violet-500 cursor-pointer transition-colors"
                >
                  {INDUSTRY_OPTIONS.map(i => (
                    <option key={i} value={i}>{i === 'All' ? 'All Industries' : i}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-violet-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Templates Grid */}
          <div className="flex-1 overflow-y-auto p-6 bg-[#111116]">
            {filteredTemplates.length === 0 ? (
              <div className="py-24 flex flex-col items-center justify-center text-zinc-500 text-center gap-3">
                <Sparkles className="w-14 h-14 text-slate-600" />
                <p className="text-lg font-bold text-zinc-300">No templates found</p>
                <p className="text-xs text-zinc-400 max-w-md">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((tmpl) => {
                  const sectionNodes = getSectionNodes(tmpl);
                  const previewNode = sectionNodes[0];
                  return (
                    <div
                      key={tmpl.id}
                      className="group relative rounded-2xl bg-[#14141a] border border-[#272730] hover:border-violet-500/70 hover:shadow-2xl hover:shadow-violet-950/30 transition-all duration-200 flex flex-col justify-between overflow-hidden"
                    >
                      {/* Visual Preview — Largest Element */}
                      <div
                        className="relative w-full cursor-pointer overflow-hidden bg-[#090910] p-3"
                        onClick={() => setPreviewTemplate(tmpl)}
                      >
                        {previewNode ? (
                          <ScaleToFitContainer targetWidth={960} maxHeight={280}>
                            <SectionPreviewRenderer sectionNode={previewNode} />
                          </ScaleToFitContainer>
                        ) : (
                          <div className="w-full h-[200px] flex items-center justify-center bg-[#0a0a14] rounded-xl">
                            <span className="text-zinc-600 text-sm">Blank Canvas</span>
                          </div>
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3 p-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewTemplate(tmpl);
                            }}
                            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/25 flex items-center gap-2 transition-all"
                          >
                            <Eye className="w-4 h-4 text-violet-300" />
                            <span>PREVIEW ALL SECTIONS</span>
                          </button>
                          {tmpl.id !== 'blank' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApplyTemplate(tmpl);
                              }}
                              className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-extrabold shadow-xl shadow-violet-600/50 flex items-center gap-2 transition-transform active:scale-95"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>USE TEMPLATE</span>
                            </button>
                          )}
                        </div>

                        {tmpl.badge && (
                          <span className="absolute top-3 right-3 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-violet-500/90 text-white shadow-lg z-10">
                            {tmpl.badge}
                          </span>
                        )}
                      </div>

                      {/* Template Info */}
                      <div className="px-5 py-4 bg-[#16161c] border-t border-[#22222a]">
                        <h3 className="text-sm font-extrabold text-white group-hover:text-violet-300 transition-colors mb-1">
                          {tmpl.name}
                        </h3>
                        <p className="text-xs text-zinc-400 line-clamp-1 mb-2">{tmpl.tagline}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                            {tmpl.style && (
                              <span className="px-1.5 py-0.5 rounded bg-white/5 font-medium">{tmpl.style}</span>
                            )}
                            <span className="text-zinc-600">·</span>
                            <span>{tmpl.sectionTemplateIds.length} sections</span>
                          </div>
                          {tmpl.id !== 'blank' && (
                            <button
                              onClick={() => handleApplyTemplate(tmpl)}
                              className="text-xs font-extrabold text-white flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 px-3 py-1.5 rounded-lg shadow-md shadow-violet-600/30 transition-all"
                            >
                              <span>Use</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* Full Template Preview Modal */}
      {previewTemplate && (
        <FullTemplatePreview
          template={previewTemplate}
          sectionNodeCache={sectionNodeCache}
          viewport={previewViewport}
          onViewportChange={setPreviewViewport}
          onClose={() => setPreviewTemplate(null)}
          onUse={() => {
            handleApplyTemplate(previewTemplate);
            setPreviewTemplate(null);
          }}
        />
      )}
    </>
  );
}

function FullTemplatePreview({
  template,
  sectionNodeCache,
  viewport,
  onViewportChange,
  onClose,
  onUse,
}: {
  template: WebsiteTemplate;
  sectionNodeCache: Map<string, any>;
  viewport: 'desktop' | 'tablet' | 'mobile';
  onViewportChange: (v: 'desktop' | 'tablet' | 'mobile') => void;
  onClose: () => void;
  onUse: () => void;
}) {
  const sectionNodes = template.sectionTemplateIds
    .map(id => sectionNodeCache.get(id))
    .filter(Boolean);

  const targetWidth = viewport === 'desktop' ? 1280 : viewport === 'tablet' ? 768 : 375;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-6xl max-h-[92vh] bg-[#141418] border border-[#27272A] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272A] bg-[#1a1a20]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">{template.name}</h2>
              {template.badge && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  {template.badge}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">{template.tagline}</p>
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
                onClick={() => onViewportChange(vp)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewport === vp ? 'bg-violet-600 text-white shadow font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Template Preview */}
        <div className="flex-1 overflow-y-auto bg-[#090910] p-6">
          <div className="mx-auto" style={{ maxWidth: `${targetWidth}px` }}>
            {sectionNodes.length > 0 ? (
              sectionNodes.map((node: any, idx: number) => (
                <div key={node.id || idx} className="mb-0">
                  <SectionPreviewRenderer sectionNode={node} />
                </div>
              ))
            ) : (
              <div className="py-24 text-center text-zinc-500">
                <p>Blank canvas — no sections</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#27272A] bg-[#1a1a20]">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="font-mono text-violet-400 uppercase font-semibold">{template.sectionTemplateIds.length} sections</span>
            {template.style && (
              <>
                <span>·</span>
                <span>{template.style}</span>
              </>
            )}
            {template.industry && template.industry.length > 0 && (
              <>
                <span>·</span>
                <span>{template.industry.join(', ')}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold transition-colors"
            >
              Close Preview
            </button>
            <button
              onClick={onUse}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Use This Template</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
